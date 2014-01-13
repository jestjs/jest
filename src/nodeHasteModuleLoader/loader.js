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

var MAIN_DIR = path.resolve(__dirname + '/../');
var CACHE_DIR_PATH = MAIN_DIR + '/.haste_cache_dir';

function _buildResourceMap(config) {
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
  function _onHasteUpdated(updatedMap) {
    deferred.resolve(updatedMap);
  }

  try {
    hasteInst.update(
      CACHE_FILE_PATH,
      deferred.resolve.bind(deferred),
      {forceRescan: true} // TODO: This should probably be togglable?
    );
  } catch (e) {
    deferred.reject(e);
  }
  return deferred.promise;
}

function initialize(config) {
  // Compile RegExp objects for each of the unmockList items once
  var configUnmockListRegExps = [];
  if (config.unmockList && config.unmockList.length > 0) {
    configUnmockListRegExps = config.unmockList.map(function(unmockPathRe) {
      return new RegExp(unmockPathRe);
    });
  }

  return _buildResourceMap(config).then(function(resourceMap) {
    var moduleContentCache = {};

    function Loader(contextGlobal, contextRunner) {
      this._contextGlobal = contextGlobal;
      this._contextRunner = contextRunner;
      this._explicitMockStatus = {};
      this._mockMetaData = {};
      this._nodeModulProjectConfigNameToResource = null;
      this._shouldAutoMock = true;
      this._unmockListModuleNames = {};

      // DO NOT USE THIS. IT IS GOING AWAY
      //
      // It's necessary for `require('mock-modules').generateMock()` in order to
      // understand the currFilePath from which the requested module name to be
      // looked up should be referenced from. jstest didn't handle relative-path
      // modules well, so it didn't have this constraint -- but we do, so we
      // have to make hacks like this to support this API.
      //
      // We should move away from require('mock-modules').generateMock() in
      // favor of `require.generateMock()`, which is a bound function per-module
      // and doesn't need to maintain this kind of statefulness separate from
      // the module.
      this._currentlyExecutingModulePath = null;

      this.resetModuleRegistry();
    }

    /**
     * Given the path to a module: Read it from disk (synchronously) and
     * evaluate it's constructor function to generate the module and exports
     * objects.
     *
     * @param string modulePath
     * @return object
     */
    Loader.prototype._execModule = function(moduleObj) {
      var modulePath = moduleObj.__filename;

      var moduleContent = moduleContentCache[modulePath];
      if (!moduleContent) {
        moduleContent = utils.readAndPreprocessFileContent(modulePath, config);

        if (codeCoverage.needsCoverage(modulePath)) {
          moduleContent = codeCoverage.transformScript(
            moduleContent,
            modulePath
          );
        }
        moduleContentCache[modulePath] = moduleContent;
      }

      var boundModuleRequire = this.constructBoundRequire(modulePath);

      var moduleLocalBindings = {
        'module': moduleObj,
        'exports': moduleObj.exports,
        'require': boundModuleRequire,
        '__dirname': path.dirname(modulePath),
        '__filename': modulePath,
        'requireDynamic': boundModuleRequire,
        'requireLazy': function(dependencies, cb) {
          cb && cb.apply(null, dependencies.map(boundModuleRequire));
        },
        'global': this._contextGlobal,
        'console': this._contextGlobal.console
      };


      // DO NOT USE THIS. IT IS GOING AWAY
      //
      // See comment above the initializer for this in the constructor.
      // It's pure clowntown. Don't you dare rely on it!
      var lastExecutingModulePath = this._currentlyExecutingModulePath;
      this._currentlyExecutingModulePath = modulePath;

      utils.runContentWithLocalBindings(
        this._contextRunner,
        moduleContent,
        modulePath,
        moduleLocalBindings
      );
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
    Loader.prototype._moduleNameToPath = function(currFilePath, moduleName) {
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
        var resource = resourceMap.getResource('JS', moduleName);
        if (!resource) {
          return this._nodeModuleNameToPath(
            currFilePath,
            moduleName
          );
        }
        return resource.path;
      }
    };

    Loader.prototype._nodeModuleNameToPath = function(currPath, moduleName) {
      // Handle module names like require('jest/lib/util')
      var subModulePath = null;
      var moduleProjectPart = moduleName;
      if (/\//.test(moduleName)) {
        var projectPathParts = moduleName.split('/');
        moduleProjectPart = projectPathParts.shift();
        subModulePath = projectPathParts.join('/');
      }

      // Memoize the project name -> package.json resource lookup map
      if (this._nodeModulProjectConfigNameToResource === null) {
        this._nodeModulProjectConfigNameToResource = {};
        var resources =
          resourceMap.getAllResourcesByType('ProjectConfiguration');
        resources.forEach(function(res) {
          this._nodeModulProjectConfigNameToResource[res.data.name] = res;
        }.bind(this));
      }

      // Get the resource for the package.json file
      var resource = this._nodeModulProjectConfigNameToResource[moduleProjectPart];
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
    Loader.prototype._shouldMock = function(currFilePath, moduleName) {
      if (this._builtInModules[moduleName]) {
        return false;
      } else if (this._explicitMockStatus.hasOwnProperty(moduleName)) {
        return this._explicitMockStatus[moduleName];
      } else if (this._shouldAutoMock) {
        // See if there's a manual mock
        var moduleResource = resourceMap.getResource('JS', moduleName);
        var manualMockResource = resourceMap.getResource('JSMock', moduleName);
        if (manualMockResource) {
          return true;
        }

        // See if the module is specified in the config as a module that should
        // never be mocked
        if (this._unmockListModuleNames.hasOwnProperty(moduleName)) {
          return this._unmockListModuleNames[moduleName];
        } else if (configUnmockListRegExps.length > 0) {
          var modulePath = this._moduleNameToPath(
            currFilePath,
            moduleName
          );
          var unmockRegExp;
          for (var i = 0; i < configUnmockListRegExps.length; i++) {
            unmockRegExp = configUnmockListRegExps[i];
            if (unmockRegExp.test(modulePath)) {
              this._unmockListModuleNames[moduleName] = false;
              break;
            }
            this._unmockListModuleNames[moduleName] = true;
          }
          return this._unmockListModuleNames[moduleName];
        }
        return true;
      } else {
        return false;
      }
    };

    Loader.prototype.constructBoundRequire = function(sourceModulePath) {
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
    Loader.prototype.requireMock = function(currFilePath, moduleName) {
      var modulePath;

      // Look in the node-haste resource map
      var manualMockResource = resourceMap.getResource('JSMock', moduleName);
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

    Loader.prototype._generateMock = function(currFilePath, moduleName) {
      var modulePath = this._moduleNameToPath(currFilePath, moduleName);

      if (!this._mockMetaData.hasOwnProperty(modulePath)) {
        var moduleExports = this.requireModule(currFilePath, moduleName);
        this._mockMetaData[modulePath] = moduleMocker.getMetadata(
          moduleExports
        );
      }

      return moduleMocker.generateFromMetadata(
        this._mockMetaData[modulePath]
      );
    };

    /**
     * Given a module name, return the *real* (un-mocked) version of said
     * module.
     *
     * @param string currFilePath The path of the file that is attempting to
     *                            resolve the module
     * @param string moduleName The name of the module to be resolved
     * @return object
     */
    Loader.prototype.requireModule = function(currFilePath, moduleName) {
      var modulePath = this._moduleNameToPath(currFilePath, moduleName);

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
      if (!moduleObj) {
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
        moduleObj = this._moduleRegistry[modulePath] = {
          __filename: modulePath,
          exports: {}
        };
        this._execModule(moduleObj);
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
    Loader.prototype.requireModuleOrMock = function(currFilePath, moduleName) {
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
    Loader.prototype.resetModuleRegistry = function() {
      var explicitMockStatus = this._explicitMockStatus;

      this._mockRegistry = {};
      this._moduleRegistry = {};
      this._builtInModules = {
        'mocks': {exports: moduleMocker},
        'mock-modules': {
          exports: {
            dontMock: function(moduleName) {
              this._explicitMockStatus[moduleName] = false;
              return this._builtInModules['mock-modules'].exports;
            }.bind(this),

            mock: function(moduleName) {
              this._explicitMockStatus[moduleName] = true;
              return this._builtInModules['mock-modules'].exports;
            }.bind(this),

            autoMockOff: function() {
              this._shouldAutoMock = false;
              return this._builtInModules['mock-modules'].exports;
            }.bind(this),

            // TODO: This is such a bad name, we should rename it to
            //       `resetModuleRegistry()` -- or anything else, really
            dumpCache: function() {
              var globalMock;
              for (var key in this._contextGlobal) {
                globalMock = this._contextGlobal[key];
                if ((typeof globalMock === 'object' && globalMock !== null)
                    || typeof globalMock === 'function') {
                  globalMock._isMockFunction && globalMock.mockClear();
                }
              }

              if (this._contextGlobal.mockClearTimers) {
                this._contextGlobal.mockClearTimers();
              }

              this.resetModuleRegistry();

              return this._builtInModules['mock-modules'].exports;
            }.bind(this),

            setMock: function(moduleName, moduleExports) {
              this._explicitMockStatus[moduleName] = true;
              var modulePath = this._moduleNameToPath(
                this._currentlyExecutingModulePath,
                moduleName
              );
              this._mockRegistry[modulePath] = moduleExports;
              return this._builtInModules['mock-modules'].exports;
            }.bind(this),

            // TODO: Wat. Is. This.
            hasDependency: function(moduleNameA, moduleNameB) {
              var resourceA = resourceMap.getResource('JS', moduleNameA);
              // TODO
            },

            generateMock: function(moduleName) {
              return this._generateMock(
                this._currentlyExecutingModulePath,
                moduleName
              );
            }.bind(this),

            useActualTimers: function() {
              require('../lib/mockTimers').uninstallMockTimers(this._contextGlobal);
            }.bind(this),

            loadActualModule: function(moduleName) {
              return this.requireModule(
                this._currentlyExecutingModulePath,
                moduleName
              );
            }.bind(this)
          }
        }
      };
    };

    return Loader;
  });
}

exports.initialize = initialize;
