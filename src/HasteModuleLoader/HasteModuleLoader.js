/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* eslint-disable fb-www/require-args */
'use strict';

const fs = require('graceful-fs');
const moduleMocker = require('../lib/moduleMocker');
const DependencyGraph = require('node-haste/lib/DependencyGraph');
const extractRequires = require('node-haste/lib/lib/extractRequires');
const path = require('path');
const resolve = require('resolve');
const transform = require('../lib/transform');

const NODE_PATH =
  (process.env.NODE_PATH ? process.env.NODE_PATH.split(path.delimiter) : null);
const IS_PATH_BASED_MODULE_NAME = /^(?:\.\.?\/|\/)/;
const VENDOR_PATH = path.resolve(__dirname, '../../vendor');
const MOCKS_PATTERN = /(?:[\\/]|^)__mocks__[\\/]([^\/]+)\.js$/;
const REQUIRE_EXTENSIONS_PATTERN = /(\brequire\s*?\.\s*?(?:requireActual|requireMock)\s*?\(\s*?)(['"])([^'"]+)(\2\s*?\))/g;

const mockParentModule = {
  id: 'mockParent',
  exports: {},
};

const isFile = file => {
  let stat;
  try {
    stat = fs.statSync(file);
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return false;
    }
  }
  return stat.isFile() || stat.isFIFO();
};

const hasOwnProperty = Object.prototype.hasOwnProperty;

let _configUnmockListRegExpCache = null;

class Loader {
  constructor(config, environment) {
    /* eslint-disable fb-www/object-create-only-one-param */
    this._config = config;
    this._coverageCollectors = {};
    this._currentlyExecutingModulePath = '';
    this._environment = environment;
    this._explicitShouldMock = {};
    this._explicitlySetMocks = {};
    this._isCurrentlyExecutingManualMock = null;
    this._mockMetaDataCache = {};
    this._shouldAutoMock = true;
    this._configShouldMockModuleNames = {};
    this._extensions = config.moduleFileExtensions.map(ext => '.' + ext);

    const ignoreFilePattern = new RegExp(
      [config.cacheDirectory].concat(config.modulePathIgnorePatterns).join('|')
    );
    this._depGraph = new DependencyGraph({
      roots: [config.rootDir],
      ignoreFilePath: path => path.match(ignoreFilePattern),
      cache: {
        get: (a, b, cb) => Promise.resolve(cb()),
        invalidate: () => {},
      },
      fileWatcher: {
        on: function() {
          return this;
        },
        isWatchman: () => Promise.resolve(false),
      },
      extensions: this._extensions.concat(this._config.testFileExtensions),
      mocksPattern: MOCKS_PATTERN,
      extractRequires: code => {
        const data = extractRequires(code);
        data.code = data.code.replace(
          REQUIRE_EXTENSIONS_PATTERN,
          (match, pre, quot, dep, post) => {
            data.deps.sync.push(dep);
            return match;
          }
        );
        return data;
      },
    });
    this._resolvedModules = Object.create(null);
    this._resources = Object.create(null);
    this._resolveDependencyPromises = Object.create(null);
    this._mocks = Object.create(null);
    /* eslint-enable fb-www/object-create-only-one-param */

    if (config.collectCoverage) {
      this._CoverageCollector = require(config.coverageCollector);
    }

    if (_configUnmockListRegExpCache === null) {
      _configUnmockListRegExpCache = new WeakMap();
    }

    if (
      !config.unmockedModulePathPatterns ||
      config.unmockedModulePathPatterns.length === 0
    ) {
      this._unmockListRegExps = [];
    } else {
      this._unmockListRegExps = _configUnmockListRegExpCache.get(config);
      if (!this._unmockListRegExps) {
        this._unmockListRegExps = config.unmockedModulePathPatterns
          .map(unmockPathRe => new RegExp(unmockPathRe));
        _configUnmockListRegExpCache.set(config, this._unmockListRegExps);
      }
    }

    // Workers communicate the config as JSON so we have to create a regex
    // object in the module loader instance.
    this._mappedModuleNames = Object.create(null);
    if (this._config.moduleNameMapper.length) {
      this._config.moduleNameMapper.forEach(
        map => this._mappedModuleNames[map[1]] = new RegExp(map[0])
      );
    }

    this.resetModuleRegistry();
  }

  getAllTestPaths() {
    return this._depGraph.matchFilesByPattern(this._config.testDirectoryName);
  }

  /**
   * Given the path to a module: Read it from disk (synchronously) and
   * evaluate it's constructor function to generate the module and exports
   * objects.
   */
  _execModule(moduleObj) {
    // If the environment was disposed, prevent this module from
    // being executed.
    if (!this._environment.global) {
      return;
    }

    const filename = moduleObj.__filename;
    let moduleContent = transform(filename, this._config);
    let collectorStore;
    const onlyCollectFrom = this._config.collectCoverageOnlyFrom;
    const shouldCollectCoverage =
      (this._config.collectCoverage === true && !onlyCollectFrom) ||
      (onlyCollectFrom && onlyCollectFrom[filename] === true);

    if (shouldCollectCoverage) {
      if (!hasOwnProperty.call(this._coverageCollectors, filename)) {
        this._coverageCollectors[filename] =
          new this._CoverageCollector(moduleContent, filename);
      }
      const collector = this._coverageCollectors[filename];
      collectorStore = collector.getCoverageDataStore();
      moduleContent =
        collector.getInstrumentedSource('____JEST_COVERAGE_DATA____');
    }

    const lastExecutingModulePath = this._currentlyExecutingModulePath;
    this._currentlyExecutingModulePath = filename;
    const origCurrExecutingManualMock = this._isCurrentlyExecutingManualMock;
    this._isCurrentlyExecutingManualMock = filename;

    // Every module receives a mock parent so they don't assume they are run
    // standalone.
    moduleObj.parent = mockParentModule;
    moduleObj.require = this.constructBoundRequire(filename);

    const evalResultVariable = 'Object.<anonymous>';
    const wrapper = '({ "' + evalResultVariable + '": function(module, exports, require, __dirname, __filename, global, jest, ____JEST_COVERAGE_DATA____) {' + moduleContent + '\n}});';
    const wrapperFunc = this._environment.runSourceText(wrapper, filename)[evalResultVariable];
    wrapperFunc.call(
      moduleObj.exports, // module context
      moduleObj,
      moduleObj.exports,
      moduleObj.require,
      path.dirname(filename),
      filename,
      this._environment.global,
      this._createRuntimeFor(filename),
      collectorStore
    );

    this._isCurrentlyExecutingManualMock = origCurrExecutingManualMock;
    this._currentlyExecutingModulePath = lastExecutingModulePath;
  }

  _generateMock(currPath, moduleName) {
    const modulePath = this._resolveModuleName(currPath, moduleName);

    if (!hasOwnProperty.call(this._mockMetaDataCache, modulePath)) {
      // This allows us to handle circular dependencies while generating an
      // automock
      this._mockMetaDataCache[modulePath] = moduleMocker.getMetadata({});

      // In order to avoid it being possible for automocking to potentially
      // cause side-effects within the module environment, we need to execute
      // the module in isolation. This accomplishes that by temporarily
      // clearing out the module and mock registries while the module being
      // analyzed is executed.
      //
      // An example scenario where this could cause issue is if the module being
      // mocked has calls into side-effectful APIs on another module.
      const origMockRegistry = this._mockRegistry;
      const origModuleRegistry = this._moduleRegistry;
      this._mockRegistry = {};
      this._moduleRegistry = {};

      const moduleExports = this.requireModule(currPath, moduleName);

      // Restore the "real" module/mock registries
      this._mockRegistry = origMockRegistry;
      this._moduleRegistry = origModuleRegistry;

      const mockMetadata = moduleMocker.getMetadata(moduleExports);
      if (mockMetadata === null) {
        throw new Error('Failed to get mock metadata: ' + modulePath);
      }
      this._mockMetaDataCache[modulePath] = mockMetadata;
    }

    return moduleMocker.generateFromMetadata(
      this._mockMetaDataCache[modulePath]
    );
  }

  _getModule(resourceName) {
    return this._resources[resourceName];
  }

  _getMockModule(resourceName) {
    if (this._mocks[resourceName]) {
      return {
        path: this._mocks[resourceName],
      };
    } else {
      const moduleName = this._resolveStubModuleName(resourceName);
      if (moduleName) {
        return this._getModule(moduleName);
      }
    }
  }

  _getNormalizedModuleID(currPath, moduleName) {
    let moduleType;
    let mockAbsPath = null;
    let realAbsPath = null;

    if (resolve.isCore(moduleName)) {
      moduleType = 'node';
      realAbsPath = moduleName;
    } else {
      moduleType = 'user';
      if (
        IS_PATH_BASED_MODULE_NAME.test(moduleName) ||
        (
          this._getModule(moduleName) === undefined &&
          this._getMockModule(moduleName) === undefined
        )
      ) {
        realAbsPath = this._resolveModuleName(currPath, moduleName);
        if (realAbsPath == null) {
          throw new Error(
            `Cannot find module '${moduleName}' from '${currPath || '.'}'`
          );
        }

        // Look up if this module has an associated manual mock.
        const mockModule = this._getMockModule(moduleName);
        if (mockModule) {
          mockAbsPath = mockModule.path;
        }
      }

      if (realAbsPath === null) {
        const moduleResource = this._getModule(moduleName);
        if (moduleResource) {
          realAbsPath = moduleResource.path;
        }
      }

      if (mockAbsPath === null) {
        const mockResource = this._getMockModule(moduleName);
        if (mockResource) {
          mockAbsPath = mockResource.path;
        }
      }
    }

    const delimiter = path.delimiter;
    return moduleType + delimiter + realAbsPath + delimiter + mockAbsPath;
  }

  resolveDependencies(path) {
    if (this._resolveDependencyPromises[path]) {
      return this._resolveDependencyPromises[path];
    }

    return this._resolveDependencyPromises[path] = this._depGraph.load()
      .then(() => this._depGraph.getDependencies(path))
      .then(response => {
        return response.finalize().then(() => {
          this._mocks = response.mocks;
          return Promise.all(response.dependencies.map(module => {
            if (!this._resolvedModules[module.path]) {
              this._resolvedModules[module.path] = {};
            }
            response.getResolvedDependencyPairs(module).forEach((pair) =>
              this._resolvedModules[module.path][pair[0]] = pair[1]
            );

            return module.getName().then(
              name => this._resources[name] = module
            );
          }));
        });
      })
      .then(() => this);
  }

  _resolveModuleName(currPath, moduleName) {
    // Check if the resolver knows about this module
    if (
      this._resolvedModules[currPath] &&
      this._resolvedModules[currPath][moduleName]
    ) {
      return this._resolvedModules[currPath][moduleName].path;
    } else {
      // Otherwise it is likely a node_module.
      return this._resolveNodeModule(currPath, moduleName);
    }
  }

  _resolveNodeModule(currPath, moduleName) {
    const basedir = path.dirname(currPath);
    try {
      return resolve.sync(moduleName, {
        basedir,
        extensions: this._extensions,
        isFile,
        paths: NODE_PATH,
        readFileSync: fs.readFileSync,
      });
    } catch (e) {
      // resolve.sync uses the basedir instead of currPath and therefore
      // doesn't throw an accurate error message.
      const relativePath = path.relative(basedir, currPath);
      throw new Error(
        `Cannot find module '${moduleName}' from '${relativePath || '.'}'`
      );
    }
  }

  /**
   * Indicates whether a given module is mocked per the current state of the
   * module loader. When a module is "mocked", that means calling
   * `requireModuleOrMock()` for the module will return the mock version
   * rather than the real version.
   */
  _shouldMock(currPath, moduleName) {
    const moduleID = this._getNormalizedModuleID(currPath, moduleName);
    if (hasOwnProperty.call(this._explicitShouldMock, moduleID)) {
      return this._explicitShouldMock[moduleID];
    } else if (resolve.isCore(moduleName)) {
      return false;
    } else if (this._shouldAutoMock) {
      // See if the module is specified in the config as a module that should
      // never be mocked
      if (hasOwnProperty.call(this._configShouldMockModuleNames, moduleName)) {
        return this._configShouldMockModuleNames[moduleName];
      } else if (this._unmockListRegExps.length > 0) {
        this._configShouldMockModuleNames[moduleName] = true;

        const manualMockResource = this._getMockModule(moduleName);
        let modulePath;
        try {
          modulePath = this._resolveModuleName(currPath, moduleName);
        } catch (e) {
          // If there isn't a real module, we don't have a path to match
          // against the unmockList regexps. If there is also not a manual
          // mock, then we throw because this module doesn't exist anywhere.
          //
          // However, it's possible that someone has a manual mock for a
          // non-existent real module. In this case, we should mock the module
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
        let unmockRegExp;

        // Never mock the jasmine environment.
        if (modulePath.indexOf(VENDOR_PATH) === 0) {
          return false;
        }

        const realPath = fs.realpathSync(modulePath);
        this._configShouldMockModuleNames[moduleName] = true;
        for (let i = 0; i < this._unmockListRegExps.length; i++) {
          unmockRegExp = this._unmockListRegExps[i];
          if (unmockRegExp.test(modulePath) ||
              unmockRegExp.test(realPath)) {
            return this._configShouldMockModuleNames[moduleName] = false;
          }
        }
        return this._configShouldMockModuleNames[moduleName];
      }
      return true;
    } else {
      return false;
    }
  }

  constructBoundRequire(modulePath) {
    const moduleRequire = this.requireModuleOrMock.bind(this, modulePath);

    moduleRequire.resolve = moduleName => {
      const ret = this._resolveModuleName(modulePath, moduleName);
      if (!ret) {
        throw new Error(`Module(${moduleName}) not found!`);
      }
      return ret;
    };
    moduleRequire.requireMock = this.requireMock.bind(this, modulePath);
    moduleRequire.requireActual = this.requireModule.bind(this, modulePath);

    // Compatibility with modules using enumerable keys of "require"
    moduleRequire.cache = Object.create(null);
    moduleRequire.extensions = Object.create(null);

    return moduleRequire;
  }

  /**
   * Returns a map from modulePath -> coverageInfo, where coverageInfo is of the
   * structure returned By CoverageCollector.extractRuntimeCoverageInfo()
   */
  getAllCoverageInfo() {
    if (!this._config.collectCoverage) {
      throw new Error(
        'config.collectCoverage was not set, so no coverage info has been ' +
        '(or will be) collected!'
      );
    }

    const coverageInfo = {};
    for (const filePath in this._coverageCollectors) {
      coverageInfo[filePath] =
        this._coverageCollectors[filePath].extractRuntimeCoverageInfo();
    }
    return coverageInfo;
  }

  getCoverageForFilePath(filePath) {
    if (!this._config.collectCoverage) {
      throw new Error(
        'config.collectCoverage was not set, so no coverage info has been ' +
        '(or will be) collected!'
      );
    }

    return (
      hasOwnProperty.call(this._coverageCollectors, filePath)
      ? this._coverageCollectors[filePath].extractRuntimeCoverageInfo()
      : null
    );
  }

  resolveDirectDependencies(path) {
    // TODO this should only resolve direct dependencies
    return this._depGraph.load()
      .then(() => this._depGraph.getDependencies(path))
      .then(response => response.dependencies.map(dep => dep.path));
  }

  /**
   * Given the path to some module, find all other files that *directly* depend
   * on it.
   */
  getDependentsFromPath(modulePath) {
    const _getRealPathFromNormalizedModuleID = moduleID => {
      return moduleID.split(path.delimiter)[1];
    };
    const _getDependencyPathsFromResource = resource => {
      const dependencyPaths = [];
      for (let i = 0; i < resource.requiredModules.length; i++) {
        let requiredModule = resource.requiredModules[i];

        // *facepalm* node-haste is pretty clowny
        if (resource.getModuleIDByOrigin) {
          requiredModule =
            resource.getModuleIDByOrigin(requiredModule) || requiredModule;
        }

        let moduleID;
        try {
          moduleID = this._getNormalizedModuleID(resource.path, requiredModule);
        } catch (e) {
          continue;
        }

        dependencyPaths.push(_getRealPathFromNormalizedModuleID(moduleID));
      }
      return dependencyPaths;
    };

    // TODO
    if (this._reverseDependencyMap == null) {
      const reverseDepMap = this._reverseDependencyMap = {};
      const allResources = [];
      Object.keys(allResources).forEach(resourceID => {
        const resource = allResources[resourceID];
        if (
          resource.type === 'ProjectConfiguration' ||
          resource.type === 'Resource'
        ) {
          return;
        }

        const dependencyPaths = _getDependencyPathsFromResource(resource);
        for (let i = 0; i < dependencyPaths.length; i++) {
          const requiredModulePath = dependencyPaths[i];
          if (!hasOwnProperty.call(reverseDepMap, requiredModulePath)) {
            reverseDepMap[requiredModulePath] = {};
          }
          reverseDepMap[requiredModulePath][resource.path] = true;
        }
      });
    }

    const reverseDeps = this._reverseDependencyMap[modulePath];
    return reverseDeps ? Object.keys(reverseDeps) : [];
  }

  /**
   * Given a module name, return the mock version of said module.
   */
  requireMock(currPath, moduleName) {
    const moduleID = this._getNormalizedModuleID(currPath, moduleName);

    if (hasOwnProperty.call(this._explicitlySetMocks, moduleID)) {
      return this._explicitlySetMocks[moduleID];
    }

    // Look in the node-haste resource map
    let manualMockResource = this._getMockModule(moduleName);
    let modulePath;
    if (manualMockResource) {
      modulePath = manualMockResource.path;
    } else {
      modulePath = this._resolveModuleName(currPath, moduleName);

      // If the actual module file has a __mocks__ dir sitting immediately next
      // to it, look to see if there is a manual mock for this file in that dir.
      //
      // The reason why node-haste isn't good enough for this is because
      // node-haste only handles manual mocks for @providesModules well.
      // Otherwise it's not good enough to disambiguate something like the
      // following scenario:
      //
      // subDir1/MyModule.js
      // subDir1/__mocks__/MyModule.js
      // subDir2/MyModule.js
      // subDir2/__mocks__/MyModule.js
      //
      // Where some other module does a relative require into each of the
      // respective subDir{1,2} directories and expects a manual mock
      // corresponding to that particular MyModule.js file.
      const moduleDir = path.dirname(modulePath);
      const moduleFileName = path.basename(modulePath);
      const potentialManualMock =
        path.join(moduleDir, '__mocks__', moduleFileName);
      if (fs.existsSync(potentialManualMock)) {
        manualMockResource = true;
        modulePath = potentialManualMock;
      }
    }

    if (hasOwnProperty.call(this._mockRegistry, modulePath)) {
      return this._mockRegistry[modulePath];
    }

    if (manualMockResource) {
      const moduleObj = {
        exports: {},
        __filename: modulePath,
      };
      this._execModule(moduleObj);
      this._mockRegistry[modulePath] = moduleObj.exports;
    } else {
      // Look for a real module to generate an automock from
      this._mockRegistry[modulePath] = this._generateMock(
        currPath,
        moduleName
      );
    }

    return this._mockRegistry[modulePath];
  }

  /**
   * Given a module name, return the *real* (un-mocked) version of said
   * module.
   */
  requireModule(currPath, moduleName) {
    const moduleID = this._getNormalizedModuleID(currPath, moduleName);
    let modulePath;

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
    // explicitly call .mock() on a module to receive the mocked version if
    // automocking is off. If a manual mock exists, that is used. Otherwise
    // we fall back to the automocking system to generate one for you.
    //
    // The only reason we're supporting this in jest for now is because we
    // have some tests that depend on this behavior. I'd like to clean this
    // up at some point in the future.
    let manualMockResource = null;
    let moduleResource = null;
    moduleResource = this._getModule(moduleName);
    manualMockResource = this._getMockModule(moduleName);
    if (
      !moduleResource &&
      manualMockResource &&
      manualMockResource.path !== this._isCurrentlyExecutingManualMock &&
      this._explicitShouldMock[moduleID] !== false
    ) {
      modulePath = manualMockResource.path;
    }

    if (resolve.isCore(moduleName)) {
      return require(moduleName);
    }

    if (!modulePath) {
      modulePath = this._resolveModuleName(currPath, moduleName);
    }

    // Always natively require the jasmine runner.
    if (modulePath.indexOf(VENDOR_PATH) === 0) {
      return require(modulePath);
    }

    if (!modulePath) {
      throw new Error(`Cannot find module '${moduleName}' from '${currPath}'`);
    }

    let moduleObj;
    moduleObj = this._moduleRegistry[modulePath];
    if (!moduleObj) {
      // We must register the pre-allocated module object first so that any
      // circular dependencies that may arise while evaluating the module can
      // be satisfied.
      moduleObj = {
        __filename: modulePath,
        exports: {},
      };

      this._moduleRegistry[modulePath] = moduleObj;
      if (path.extname(modulePath) === '.json') {
        moduleObj.exports = this._environment.global.JSON.parse(
          fs.readFileSync(modulePath, 'utf8')
        );
      } else if (path.extname(modulePath) === '.node') {
        moduleObj.exports = require(modulePath);
      } else {
        this._execModule(moduleObj);
      }
    }

    return moduleObj.exports;
  }

  /**
   * If the moduleNameMapper config is set, go through all the mappings
   * and resolve the module name.
   */
  _resolveStubModuleName(moduleName) {
    const nameMapper = this._mappedModuleNames;
    for (const mappedModuleName in nameMapper) {
      const regex = nameMapper[mappedModuleName];
      if (regex.test(moduleName)) {
        return mappedModuleName;
      }
    }
  }

  /**
   * Given a module name, return either the real module or the mock version of
   * that module -- depending on the mocking state of the loader (and, perhaps
   * the mocking state for the requested module).
   */
  requireModuleOrMock(currPath, moduleName) {
    if (this._shouldMock(currPath, moduleName)) {
      return this.requireMock(currPath, moduleName);
    } else {
      return this.requireModule(currPath, moduleName);
    }
  }

  _createRuntimeFor(currPath) {
    const runtime = {
      addMatchers: matchers => {
        const jasmine = this._environment.global.jasmine;
        jasmine.getEnv().currentSpec.addMatchers(matchers);
      },

      autoMockOff: () => {
        this._shouldAutoMock = false;
        return runtime;
      },

      autoMockOn: () => {
        this._shouldAutoMock = true;
        return runtime;
      },

      clearAllTimers: () => this._environment.fakeTimers.clearAllTimers(),
      currentTestPath: () => this._environment.testFilePath,

      dontMock: moduleName => {
        const moduleID = this._getNormalizedModuleID(currPath, moduleName);
        this._explicitShouldMock[moduleID] = false;
        return runtime;
      },

      getTestEnvData: () => {
        const frozenCopy = {};
        // Make a shallow copy only because a deep copy seems like
        // overkill..
        Object.keys(this._config.testEnvData).forEach(
          key => frozenCopy[key] = this._config.testEnvData[key]
        );
        Object.freeze(frozenCopy);
        return frozenCopy;
      },

      genMockFromModule: moduleName => this._generateMock(currPath, moduleName),
      genMockFunction: moduleMocker.getMockFunction,
      genMockFn: moduleMocker.getMockFunction,

      mock: moduleName => {
        const moduleID = this._getNormalizedModuleID(currPath, moduleName);
        this._explicitShouldMock[moduleID] = true;
        return runtime;
      },

      resetModuleRegistry: () => {
        this.resetModuleRegistry();
        return runtime;
      },

      runAllTicks: () => this._environment.fakeTimers.runAllTicks(),
      runAllImmediates: () => this._environment.fakeTimers.runAllImmediates(),
      runAllTimers: () => this._environment.fakeTimers.runAllTimers(),
      runOnlyPendingTimers: () =>
        this._environment.fakeTimers.runOnlyPendingTimers(),

      setMock: (moduleName, moduleExports) => {
        const moduleID = this._getNormalizedModuleID(currPath, moduleName);
        this._explicitShouldMock[moduleID] = true;
        this._explicitlySetMocks[moduleID] = moduleExports;
        return runtime;
      },

      useFakeTimers: () => this._environment.fakeTimers.useFakeTimers(),
      useRealTimers: () => this._environment.fakeTimers.useRealTimers(),
    };
    return runtime;
  }

  resetModuleRegistry() {
    this._mockRegistry = {};
    this._moduleRegistry = {};

    if (this._environment && this._environment.global) {
      var envGlobal = this._environment.global;
      Object.keys(envGlobal).forEach(key => {
        const globalMock = envGlobal[key];
        if (
          (typeof globalMock === 'object' && globalMock !== null) ||
          typeof globalMock === 'function'
        ) {
          globalMock._isMockFunction && globalMock.mockClear();
        }
      });

      if (envGlobal.mockClearTimers) {
        envGlobal.mockClearTimers();
      }
    }
  }

}

module.exports = Loader;
