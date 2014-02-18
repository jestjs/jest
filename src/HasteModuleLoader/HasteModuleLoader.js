var codeCoverage = require('../lib/codeCoverage');
var fs = require('fs');
var hasteLoaders = require('node-haste/lib/loaders');
var inherits = require('util').inherits;
var JSResource = require('node-haste/lib/resource/JS');
var moduleMocker = require('../lib/moduleMocker');
var NodeHaste = require('node-haste/lib/Haste');
var os = require('os');
var path = require('path');
var PathResolver = require('node-haste/lib/PathResolver');
var Q = require('q');
var resolve = require('resolve');
var utils = require('../lib/utils');

var MAIN_DIR = path.resolve(__dirname + '/../');
var CACHE_DIR_PATH = MAIN_DIR + '/.haste_cache_dir';

var IS_PATH_BASED_MODULE_NAME = /^(?:\.\.?\/|\/)/;

var NODE_CORE_MODULES = {
  assert: true,
  buffer: true,
  child_process: true,
  cluster: true,
  console: true,
  constants: true,
  crypto: true,
  dgram: true,
  dns: true,
  domain: true,
  events: true,
  freelist: true,
  fs: true,
  http: true,
  https: true,
  module: true,
  net: true,
  os: true,
  path: true,
  punycode: true,
  querystring: true,
  readline: true,
  repl: true,
  smalloc: true,
  stream: true,
  string_decoder: true,
  sys: true,
  timers: true,
  tls: true,
  tty: true,
  url: true,
  util: true,
  vm: true,
  zlib: true
};

var _configUnmockListRegExpCache = new WeakMap();
var _moduleContentCache = {};

function HasteModuleLoader(config, environment, resourceMap) {
  this._config = config;
  this._currentlyExecutingModulePath = '';
  this._environment = environment;
  this._explicitShouldMock = {};
  this._isCurrentlyExecutingManualMock = null;
  this._mockMetaDataCache = {};
  // TODO: Init the following property as an object for consistent typing
  this._nodeModuleProjectConfigNameToResource = null;
  this._resourceMap = resourceMap;
  this._shouldAutoMock = true;
  // TODO: Rename this variable, it's confusing...
  this._unmockListModuleNames = {};

  if (!config.unmockList || config.unmockList.length === 0) {
    this._unmockListRegExps = [];
  } else {
    this._unmockListRegExps = _configUnmockListRegExpCache.get(config);
    if (!this._unmockListRegExps) {
      this._unmockListRegExps = config.unmockList.map(function(unmockPathRe) {
        return new RegExp(unmockPathRe);
      });
      _configUnmockListRegExpCache.set(config, this._unmockListRegExps);
    }
  }

  this.resetModuleRegistry();
}

HasteModuleLoader.loadResourceMap = function(config) {
  var CACHE_FILE_PATH = CACHE_DIR_PATH + '/cache-' + config.projectName;
  var DIR_SKIP_REGEX = new RegExp(config.dirSkipRegex || '__NOT_EXIST__');

  if (!fs.existsSync(CACHE_DIR_PATH)) {
    fs.mkdirSync(CACHE_DIR_PATH);
  }

  var hasteInst = new NodeHaste(
    [
      new hasteLoaders.ProjectConfigurationLoader(),
      new hasteLoaders.JSTestLoader(config.setupJSTestLoaderOptions),
      new hasteLoaders.JSMockLoader(config.setupJSMockLoaderOptions),
      new hasteLoaders.JSLoader(config.setupJSLoaderOptions),
      new hasteLoaders.ResourceLoader()
    ],
    (config.jsScanDirs || []),
    {
      ignorePaths: function(path) {
        return path.match(DIR_SKIP_REGEX);
      },
      version: JSON.stringify(config),
      useNativeFind: true,
      // TODO: Hmm...what's node-haste doing with processes?
      maxProcesses: os.cpus().length,
      maxOpenFiles: 1000
    }
  );

  var deferred = Q.defer();
  try {
    hasteInst.update(
      CACHE_FILE_PATH,
      function(resourceMap) {
        deferred.resolve(resourceMap);
      },
      {forceRescan: true}
    );
  } catch (e) {
    deferred.reject(e);
  }
  return deferred.promise;
}

/**
 * Given the path to a module: Read it from disk (synchronously) and
 * evaluate it's constructor function to generate the module and exports
 * objects.
 *
 * @param string modulePath
 * @param bool isManualMock = false
 * @return object
 */
HasteModuleLoader.prototype._execModule = function(moduleObj, isManualMock) {
  var modulePath = moduleObj.__filename;

  var moduleContent = _moduleContentCache[modulePath];
  if (!moduleContent) {
    moduleContent = utils.readAndPreprocessFileContent(
      modulePath,
      this._config
    );

    if (codeCoverage.needsCoverage(modulePath)) {
      moduleContent = codeCoverage.transformScript(
        moduleContent,
        modulePath
      );
    }
    _moduleContentCache[modulePath] = moduleContent;
  }

  var boundModuleRequire = this.constructBoundRequire(modulePath);

  var moduleLocalBindings = {
    'module': moduleObj,
    'exports': moduleObj.exports,
    'require': boundModuleRequire,
    '__dirname': path.dirname(modulePath),
    '__filename': modulePath,
    'global': this._environment.global
  };


  var lastExecutingModulePath = this._currentlyExecutingModulePath;
  this._currentlyExecutingModulePath = modulePath;

  var origCurrExecutingManualMock = this._isCurrentlyExecutingManualMock;
  this._isCurrentlyExecutingManualMock = modulePath;//!!isManualMock;

  utils.runContentWithLocalBindings(
    this._environment.runSourceText,
    moduleContent,
    modulePath,
    moduleLocalBindings
  );

  this._isCurrentlyExecutingManualMock = origCurrExecutingManualMock;
  this._currentlyExecutingModulePath = lastExecutingModulePath;
};

/**
 * Given a module name and the current file path, returns the normalized
 * (absolute) module path for said module. Relative-path CommonJS require()s
 * such as `require('./otherModule')` need to be looked up with context of
 * the module that's calling require()
 *
 * Also contains special case logic for built-in modules, in which it just
 * returns the module name.
 *
 * @param string currFilePath The path of the file that is attempting to
 *                            resolve the module
 * @param string moduleName The name of the module to be resolved
 * @return string
 */
HasteModuleLoader.prototype._moduleNameToPath = function(currFilePath, moduleName) {
  if (this._builtInModules[moduleName]) {
    return moduleName;
  }

  // Relative-path CommonJS require()s such as `require('./otherModule')`
  // need to be looked up with context of the module that's calling
  // require().
  if (IS_PATH_BASED_MODULE_NAME.test(moduleName)) {
    // Normalize the relative path to an absolute path
    var modulePath = path.resolve(currFilePath, '..', moduleName);

    if (fs.existsSync(modulePath)) {
      if (fs.statSync(modulePath).isDirectory()) {
        if (fs.existsSync(modulePath + '.js')
            && fs.statSync(modulePath + '.js').isFile()) {
          // The required path is a valid directory, but there's also a
          // matching js file at the same path -- so the js file wins
          return modulePath + '.js';
        } else {
          // The required path is a valid directory, but there's no matching
          // js file at the same path. So look in the directory for an
          // index.js file.
          var indexPath = path.join(modulePath, 'index.js');
          if (fs.existsSync(indexPath)) {
            return indexPath;
          } else {
            throw new Error('Module(' + moduleName + ') does not exist!');
          }
        }
      } else {
        // The required path is a file, so return this path
        return modulePath;
      }
    } else if (fs.existsSync(modulePath + '.js')
               && fs.statSync(modulePath + '.js').isFile()) {
      // The required path doesn't exist, but a .js file at that path does
      // so use that.
      return modulePath + '.js';
    } else if (fs.existsSync(modulePath + '.json')
               && fs.statSync(modulePath + '.json').isFile()) {
      // The required path doesn't exist, nor does a .js file at that path,
      // but a .json file does -- so use that
      return modulePath + '.json';
    }
  } else {
    var resource = this._resourceMap.getResource('JS', moduleName);
    if (!resource) {
      return this._nodeModuleNameToPath(
        currFilePath,
        moduleName
      );
    }
    return resource.path;
  }
};

HasteModuleLoader.prototype._nodeModuleNameToPath = function(currPath, moduleName) {
  // Handle module names like require('jest/lib/util')
  var subModulePath = null;
  var moduleProjectPart = moduleName;
  if (/\//.test(moduleName)) {
    var projectPathParts = moduleName.split('/');
    moduleProjectPart = projectPathParts.shift();
    subModulePath = projectPathParts.join('/');
  }

  // Memoize the project name -> package.json resource lookup map
  if (this._nodeModuleProjectConfigNameToResource === null) {
    this._nodeModuleProjectConfigNameToResource = {};
    var resources =
      this._resourceMap.getAllResourcesByType('ProjectConfiguration');
    resources.forEach(function(res) {
      this._nodeModuleProjectConfigNameToResource[res.data.name] = res;
    }.bind(this));
  }

  // Get the resource for the package.json file
  var resource = this._nodeModuleProjectConfigNameToResource[moduleProjectPart];
  if (!resource) {
    if (NODE_CORE_MODULES[moduleName]) {
      return null;
    }
    return resolve.sync(moduleName, {basedir: path.dirname(currPath)});
  }

  // Make sure the resource path is above the currFilePath in the fs path
  // tree. If so, just use node's resolve
  var resourceDirname = path.dirname(resource.path);
  var currFileDirname = path.dirname(currPath);
  if (resourceDirname.indexOf(currFileDirname) > 0) {
    return resolve.sync(moduleName, {basedir: path.dirname(currPath)});
  }

  if (subModulePath === null) {
    subModulePath =
      resource.data.hasOwnProperty('main')
      ? resource.data.main
      : 'index.js';
  }

  return this._moduleNameToPath(
    resource.path,
    './' + subModulePath
  );
};

/**
 * Indicates whether a given module is mocked per the current state of the
 * module loader. When a module is "mocked", that means calling
 * `requireModuleOrMock()` for the module will return the mock version
 * rather than the real version.
 *
 * @param string currFilePath The path of the file that is attempting to
 *                            resolve the module
 * @param string moduleName The name of the module to be resolved
 * @return bool
 */
HasteModuleLoader.prototype._shouldMock = function(currFilePath, moduleName) {
  if (this._builtInModules[moduleName]) {
    return false;
  } else if (this._explicitShouldMock.hasOwnProperty(moduleName)) {
    return this._explicitShouldMock[moduleName];
  } else if (this._shouldAutoMock) {

    // See if the module is specified in the config as a module that should
    // never be mocked
    if (this._unmockListModuleNames.hasOwnProperty(moduleName)) {
      return this._unmockListModuleNames[moduleName];
    } else if (this._unmockListRegExps.length > 0) {
      this._unmockListModuleNames[moduleName] = true;

      var manualMockResource =
        this._resourceMap.getResource('JSMock', moduleName);
      try {
        var modulePath = this._moduleNameToPath(currFilePath, moduleName);
      } catch(e) {
        // If there isn't a real module, we don't have a path to match
        // against the unmockList regexps. If there is also not a manual
        // mock, then we throw because this module doesn't exist anywhere.
        //
        // However, it's possible that someone has a manual mock for a
        // non-existant real module. In this case, we should mock the module
        // (because we technically can).
        //
        // Ideally this should never happen, but we have some odd
        // pre-existing edge-cases that rely on it so we need it for now.
        //
        // I'd like to eliminate this behavior in favor of requiring that
        // all module environments are complete (meaning you can't just
        // write a manual mock as a substitute for a real module).
        if (manualMockResource) {
          return true;
        }
        throw e;
      }
      var unmockRegExp;

      this._unmockListModuleNames[moduleName] = true;
      for (var i = 0; i < this._unmockListRegExps.length; i++) {
        unmockRegExp = this._unmockListRegExps[i];
        if (unmockRegExp.test(modulePath)) {
          return this._unmockListModuleNames[moduleName] = false;
        }
      }
      return this._unmockListModuleNames[moduleName];
    }
    return true;
  } else {
    return false;
  }
};

HasteModuleLoader.prototype.constructBoundRequire = function(sourceModulePath) {
  var boundModuleRequire = this.requireModuleOrMock.bind(
    this,
    sourceModulePath
  );

  boundModuleRequire.resolve = function(moduleName) {
    var ret = this._moduleNameToPath(sourceModulePath, moduleName);
    if (!ret) {
      throw new Error('Module(' + moduleName + ') not found!');
    }
    return ret;
  }.bind(this);
  boundModuleRequire.generateMock = this._generateMock.bind(
    this,
    sourceModulePath
  );
  boundModuleRequire.requireMock = this.requireMock.bind(
    this,
    sourceModulePath
  );
  boundModuleRequire.requireActual = this.requireModule.bind(
    this,
    sourceModulePath
  );

  return boundModuleRequire;
};

/**
 * Given a module name, return the mock version of said module.
 * The steps for resolving/generating the "mock" version of a module is as
 * follows:
 *
 *   TODO: The following is just what I think this *should* do.
 *         We'll need to look at jstest's actual implementation and use that
 *         no matter how clowny it may seem or how much I disagree with it.
 *         (We can come back and address oddities later)
 *
 *   1) Look in `this._mockRegistry` to see if there is already a mock
 *      cached for this module. Note that this finds mocks explicitly set
 *      via `require('mock-modules').setMock()` as well
 *   2) Look for a manual mock (via the node-haste resource map)
 *   3) Look for a real module, pass it to the mocker utility (to create a
 *      mock), and return the resulting generated mock
 *
 * @param string currFilePath The path of the file that is attempting to
 *                            resolve the module
 * @param string moduleName The name of the module to be resolved
 * @return object
 */
HasteModuleLoader.prototype.requireMock = function(currFilePath, moduleName) {
  var modulePath;

  // Look in the node-haste resource map
  var manualMockResource = this._resourceMap.getResource('JSMock', moduleName);
  var modulePath;
  if (manualMockResource) {
    modulePath = manualMockResource.path;
  } else {
    modulePath = this._moduleNameToPath(currFilePath, moduleName);
  }

  if (this._mockRegistry.hasOwnProperty(modulePath)) {
    return this._mockRegistry[modulePath];
  }

  if (manualMockResource) {
    var moduleObj = {
      exports: {},
      __filename: modulePath
    };
    this._execModule(moduleObj);
    this._mockRegistry[modulePath] = moduleObj.exports;
  } else {
    // Look for a real module to generate an automock from
    this._mockRegistry[modulePath] = this._generateMock(
      currFilePath,
      moduleName
    );
  }

  return this._mockRegistry[modulePath];
};

HasteModuleLoader.prototype._generateMock = function(currFilePath, moduleName) {
  var modulePath = this._moduleNameToPath(currFilePath, moduleName);

  if (!this._mockMetaDataCache.hasOwnProperty(modulePath)) {
    // This allows us to handle circular dependencies while generating an
    // automock
    this._mockMetaDataCache[modulePath] = moduleMocker.getMetadata({});

    // In order to avoid it being possible for automocking to potentially cause
    // side-effects within the module environment, we need to execute the module
    // in isolation. This accomplishes that by temporarily clearing out the
    // module and mock registries while the module being analyzed is executed.
    //
    // An example scenario where this could cause issue is if the module being
    // mocked has calls into side-effectful APIs on another module.
    var origMockRegistry = this._mockRegistry;
    var origModuleRegistry = this._moduleRegistry;
    this._mockRegistry = {};
    this._moduleRegistry = {};

    var moduleExports = this.requireModule(currFilePath, moduleName);

    // Restore the "real" module/mock registries
    this._mockRegistry = origMockRegistry;
    this._moduleRegistry = origModuleRegistry;

    this._mockMetaDataCache[modulePath] = moduleMocker.getMetadata(
      moduleExports
    );
  }

  return moduleMocker.generateFromMetadata(
    this._mockMetaDataCache[modulePath]
  );
};

/**
 * Given a module name, return the *real* (un-mocked) version of said
 * module.
 *
 * @param string currFilePath The path of the file that is attempting to
 *                            resolve the module
 * @param string moduleName The name of the module to be resolved
 * @param bool bypassRegistryCache Whether we should read from/write to the
 *                                 module registry. Fuck this arg.
 * @return object
 */
HasteModuleLoader.prototype.requireModule = function(currFilePath, moduleName,
                                                     bypassRegistryCache) {
  var modulePath;

  // I don't like this behavior as it makes the module system's mocking
  // rules harder to understand. Would much prefer that mock state were
  // either "on" or "off" -- rather than "automock on", "automock off",
  // "automock off -- but there's a manual mock, so you get that if you ask
  // for the module and one doesnt exist", or "automock off -- but theres a
  // useAutoMock: false entry in the package.json -- and theres a manual
  // mock -- and the module is listed in the unMockList in the test config
  // -- soooo...uhh...fuck I lost track".
  //
  // To simplify things I'd like to move to a system where tests must
  // explicitly call .mock() on a module to recieve the mocked version if
  // automocking is off. If a manual mock exists, that is used. Otherwise
  // we fall back to the automocking system to generate one for you.
  //
  // The only reason we're supporting this in jest for now is because we
  // have some tests that depend on this behavior. I'd like to clean this
  // up at some point in the future.
  var manualMockResource = null;
  var moduleResource = null;
  moduleResource = this._resourceMap.getResource('JS', moduleName);
  manualMockResource = this._resourceMap.getResource('JSMock', moduleName);
  if (!moduleResource
      && manualMockResource
      && manualMockResource.path !== this._isCurrentlyExecutingManualMock
      && this._explicitShouldMock[moduleName] !== false) {
    modulePath = manualMockResource.path;
  }

  if (!modulePath) {
    modulePath = this._moduleNameToPath(currFilePath, moduleName);
  }

  if (!modulePath) {
    if (NODE_CORE_MODULES[moduleName]) {
      return require(moduleName);
    }

    throw new Error(
      'Cannot find module \'' + moduleName + '\' from \'' + currFilePath +
      '\''
    );
  }

  var moduleObj = this._builtInModules[modulePath];
  if (!moduleObj && !bypassRegistryCache) {
    moduleObj = this._moduleRegistry[modulePath];
  }
  if (!moduleObj) {
    // Good ole node...
    if (path.extname(modulePath) === '.json') {
      return this._moduleRegistry[modulePath] = JSON.parse(fs.readFileSync(
        modulePath,
        'utf8'
      ));
    }

    // We must register the pre-allocated module object first so that any
    // circular dependencies that may arise while evaluating the module can
    // be satisfied.
    moduleObj = {
      __filename: modulePath,
      exports: {}
    };

    if (!bypassRegistryCache) {
      this._moduleRegistry[modulePath] = moduleObj;
    }

    this._execModule(moduleObj, manualMockResource !== null);
  }

  return moduleObj.exports;
};

/**
 * Given a module name, return either the real module or the mock version of
 * that module -- depending on the mocking state of the loader (and, perhaps
 * the mocking state for the requested module).
 *
 * @param string currFilePath The path of the file that is attempting to
 *                            resolve the module
 * @param string moduleName The name of the module to be resolved
 * @return object
 */
HasteModuleLoader.prototype.requireModuleOrMock = function(currFilePath, moduleName) {
  if (this._shouldMock(currFilePath, moduleName)) {
    return this.requireMock(currFilePath, moduleName);
  } else {
    return this.requireModule(currFilePath, moduleName);
  }
};

/**
 * Clears all cached module objects. This allows one to reset the state of
 * all modules in the system. It will reset (read: clear) the export objects
 * for all evaluated modules and mocks.
 *
 * @return void
 */
HasteModuleLoader.prototype.resetModuleRegistry = function() {
  var explicitMockStatus = this._explicitShouldMock;

  this._mockRegistry = {};
  this._moduleRegistry = {};
  this._builtInModules = {
    'mocks': {exports: moduleMocker},
    'mock-modules': {
      exports: {
        dontMock: function(moduleName) {
          this._explicitShouldMock[moduleName] = false;
          return this._builtInModules['mock-modules'].exports;
        }.bind(this),

        mock: function(moduleName) {
          this._explicitShouldMock[moduleName] = true;
          return this._builtInModules['mock-modules'].exports;
        }.bind(this),

        autoMockOff: function() {
          this._shouldAutoMock = false;
          return this._builtInModules['mock-modules'].exports;
        }.bind(this),

        autoMockOn: function() {
          this._shouldAutoMock = true;
          return this._builtInModules['mock-modules'].exports;
        }.bind(this),

        // TODO: This is such a bad name, we should rename it to
        //       `resetModuleRegistry()` -- or anything else, really
        dumpCache: function() {
          var globalMock;
          for (var key in this._environment.global) {
            globalMock = this._environment.global[key];
            if ((typeof globalMock === 'object' && globalMock !== null)
                || typeof globalMock === 'function') {
              globalMock._isMockFunction && globalMock.mockClear();
            }
          }

          if (this._environment.global.mockClearTimers) {
            this._environment.global.mockClearTimers();
          }

          this.resetModuleRegistry();

          return this._builtInModules['mock-modules'].exports;
        }.bind(this),

        setMock: function(moduleName, moduleExports) {
          this._explicitShouldMock[moduleName] = true;
          var modulePath = this._moduleNameToPath(
            this._currentlyExecutingModulePath,
            moduleName
          );
          this._mockRegistry[modulePath] = moduleExports;
          return this._builtInModules['mock-modules'].exports;
        }.bind(this),

        // wtf is this shit?
        hasDependency: function(moduleAName, moduleBName) {
          //var resourceA = this._resourceMap.getResource('JS', moduleAName);
          var resourceMap = this._resourceMap;
          var traversedModules = {};

          function _recurse(moduleAName, moduleBName) {
            traversedModules[moduleAName] = true;
            if (moduleAName === moduleBName) {
              return true;
            }
            var moduleAResource = resourceMap.getResource('JS', moduleAName);
            return !!(
              moduleAResource
              && moduleAResource.requiredModules
              && moduleAResource.requiredModules.some(function(dep) {
                return !traversedModules[dep] && _recurse(dep, moduleBName);
              })
            );
          }

          return _recurse(moduleAName, moduleBName);
        }.bind(this),

        generateMock: function(moduleName) {
          return this._generateMock(
            this._currentlyExecutingModulePath,
            moduleName
          );
        }.bind(this),

        useActualTimers: function() {
          require('../lib/mockTimers').uninstallMockTimers(this._environment.global);
        }.bind(this),

        /**
         * Load actual module without reading from or writing to module exports
         * registry. This method's name is devastatingly misleading. :(
         */
        loadActualModule: function(moduleName) {
          return this.requireModule(
            this._currentlyExecutingModulePath,
            moduleName,
            true // yay boolean args!
          );
        }.bind(this)
      }
    }
  };
};

module.exports = HasteModuleLoader;
