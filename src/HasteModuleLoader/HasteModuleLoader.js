/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* eslint-disable fb-www/require-args, fb-www/object-create-only-one-param */
'use strict';

const fs = require('graceful-fs');
const moduleMocker = require('../lib/moduleMocker');
const path = require('path');
const resolve = require('resolve');
const transform = require('../lib/transform');

const NODE_PATH =
  (process.env.NODE_PATH ? process.env.NODE_PATH.split(path.delimiter) : null);
const IS_PATH_BASED_MODULE_NAME = /^(?:\.\.?\/|\/)/;
const VENDOR_PATH = path.resolve(__dirname, '../../vendor');

const mockParentModule = {
  id: 'mockParent',
  exports: {},
};

const normalizedIDCache = Object.create(null);
const moduleNameCache = Object.create(null);

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

let _configUnmockListRegExpCache = null;

class Loader {
  constructor(config, environment, moduleMap) {
    this._config = config;
    this._coverageCollectors = Object.create(null);
    this._currentlyExecutingModulePath = '';
    this._environment = environment;
    this._explicitShouldMock = Object.create(null);
    this._explicitlySetMocks = Object.create(null);
    this._isCurrentlyExecutingManualMock = null;
    this._mockMetaDataCache = Object.create(null);
    this._shouldAutoMock = true;
    this._configShouldMockModuleNames = Object.create(null);
    this._extensions = config.moduleFileExtensions.map(ext => '.' + ext);

    this._modules = moduleMap.modules;
    this._mocks = moduleMap.mocks;

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
      manualMockResource !== this._isCurrentlyExecutingManualMock &&
      this._explicitShouldMock[moduleID] !== false
    ) {
      modulePath = manualMockResource;
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

  requireMock(currPath, moduleName) {
    const moduleID = this._getNormalizedModuleID(currPath, moduleName);

    if (moduleID in this._explicitlySetMocks) {
      return this._explicitlySetMocks[moduleID];
    }

    let manualMockResource = this._getMockModule(moduleName);
    let modulePath;
    if (manualMockResource) {
      modulePath = manualMockResource;
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

    if (modulePath in this._mockRegistry) {
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

  requireModuleOrMock(currPath, moduleName) {
    if (this._shouldMock(currPath, moduleName)) {
      return this.requireMock(currPath, moduleName);
    } else {
      return this.requireModule(currPath, moduleName);
    }
  }

  resetModuleRegistry() {
    this._mockRegistry = Object.create(null);
    this._moduleRegistry = Object.create(null);

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

  getAllCoverageInfo() {
    const coverage = Object.create(null);
    if (this._config.collectCoverage) {
      const collectors = this._coverageCollectors;
      for (const filePath in collectors) {
        coverage[filePath] = collectors[filePath].extractRuntimeCoverageInfo();
      }
    }
    return coverage;
  }

  _execModule(moduleObj) {
    // If the environment was disposed, prevent this module from
    // being executed.
    if (!this._environment.global) {
      return;
    }

    const filename = moduleObj.__filename;
    const collectors = this._coverageCollectors;
    const collectOnlyFrom = this._config.collectCoverageOnlyFrom;
    const shouldCollectCoverage = (
      (this._config.collectCoverage && !collectOnlyFrom) ||
      (collectOnlyFrom && collectOnlyFrom[filename])
    );
    let moduleContent = transform(filename, this._config);
    let collectorStore;
    if (shouldCollectCoverage && !filename.includes('/node_modules/')) {
      if (!collectors[filename]) {
        collectors[filename] = new this._CoverageCollector(
          moduleContent,
          filename
        );
      }
      const collector = collectors[filename];
      collectorStore = collector.getCoverageDataStore();
      moduleContent = collector.getInstrumentedSource('$JEST_COVERAGE_DATA');
    }

    const lastExecutingModulePath = this._currentlyExecutingModulePath;
    this._currentlyExecutingModulePath = filename;
    const origCurrExecutingManualMock = this._isCurrentlyExecutingManualMock;
    this._isCurrentlyExecutingManualMock = filename;

    // Every module receives a mock parent so they don't assume they are run
    // standalone.
    moduleObj.parent = mockParentModule;
    moduleObj.require = this._createRequireImplementation(filename);

    const evalResultVariable = 'Object.<anonymous>';
    const wrapper = '({ "' + evalResultVariable + '": function(module, exports, require, __dirname, __filename, global, jest, $JEST_COVERAGE_DATA) {' + moduleContent + '\n}});';
    const wrapperFunc = this._environment.runSourceText(wrapper, filename)[evalResultVariable];
    wrapperFunc.call(
      moduleObj.exports, // module context
      moduleObj, // module object
      moduleObj.exports, // module exports
      moduleObj.require, // require implementation
      path.dirname(filename), // __dirname
      filename, // __filename
      this._environment.global, // global object
      this._createRuntimeFor(filename), // jest object
      collectorStore // the coverage object
    );

    this._isCurrentlyExecutingManualMock = origCurrExecutingManualMock;
    this._currentlyExecutingModulePath = lastExecutingModulePath;
  }

  _generateMock(currPath, moduleName) {
    const modulePath = this._resolveModuleName(currPath, moduleName);

    if (!(modulePath in this._mockMetaDataCache)) {
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
      this._mockRegistry = Object.create(null);
      this._moduleRegistry = Object.create(null);

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

  _resolveModuleName(currPath, moduleName) {
    // Check if the resolver knows about this module
    if (this._modules[moduleName]) {
      return this._modules[moduleName];
    } else {
      // Otherwise it is likely a node_module.
      const key = currPath + ' : ' + moduleName;
      if (moduleNameCache[key]) {
        return moduleNameCache[key];
      }
      moduleNameCache[key] = this._resolveNodeModule(currPath, moduleName);
      return moduleNameCache[key];
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
      const parts = moduleName.split('/');
      const nodeModuleName = parts.shift();
      const module = this._getModule(nodeModuleName);
      if (module) {
        try {
          return require.resolve(
            path.join.apply(path, [path.dirname(module)].concat(parts))
          );
        } catch (ignoredError) {}
      }

      // resolve.sync uses the basedir instead of currPath and therefore
      // doesn't throw an accurate error message.
      const relativePath = path.relative(basedir, currPath);
      throw new Error(
        `Cannot find module '${moduleName}' from '${relativePath || '.'}'`
      );
    }
  }

  _getModule(resourceName) {
    return this._modules[resourceName];
  }

  _getMockModule(resourceName) {
    if (this._mocks[resourceName]) {
      return this._mocks[resourceName];
    } else {
      const moduleName = this._resolveStubModuleName(resourceName);
      if (moduleName) {
        return this._getModule(moduleName);
      }
    }
  }

  _getNormalizedModuleID(currPath, moduleName) {
    const key = currPath + ' : ' + moduleName;
    if (normalizedIDCache[key]) {
      return normalizedIDCache[key];
    }

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
          mockAbsPath = mockModule;
        }
      }

      if (realAbsPath === null) {
        const moduleResource = this._getModule(moduleName);
        if (moduleResource) {
          realAbsPath = moduleResource;
        }
      }

      if (mockAbsPath === null) {
        const mockResource = this._getMockModule(moduleName);
        if (mockResource) {
          mockAbsPath = mockResource;
        }
      }
    }

    const delimiter = path.delimiter;
    const id = moduleType + delimiter + realAbsPath + delimiter + mockAbsPath;
    normalizedIDCache[key] = id;
    return id;
  }

  _shouldMock(currPath, moduleName) {
    const moduleID = this._getNormalizedModuleID(currPath, moduleName);
    if (moduleID in this._explicitShouldMock) {
      return this._explicitShouldMock[moduleID];
    } else if (resolve.isCore(moduleName)) {
      return false;
    } else if (this._shouldAutoMock) {
      // See if the module is specified in the config as a module that should
      // never be mocked
      if (moduleName in this._configShouldMockModuleNames) {
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

  _resolveStubModuleName(moduleName) {
    const nameMapper = this._mappedModuleNames;
    for (const mappedModuleName in nameMapper) {
      const regex = nameMapper[mappedModuleName];
      if (regex.test(moduleName)) {
        return mappedModuleName;
      }
    }
  }

  _createRequireImplementation(path) {
    const moduleRequire = this.requireModuleOrMock.bind(this, path);
    moduleRequire.requireMock = this.requireMock.bind(this, path);
    moduleRequire.requireActual = this.requireModule.bind(this, path);
    moduleRequire.resolve = moduleName => {
      const ret = this._resolveModuleName(path, moduleName);
      if (!ret) {
        throw new Error(`Module(${moduleName}) not found!`);
      }
      return ret;
    };
    moduleRequire.cache = Object.create(null);
    moduleRequire.extensions = Object.create(null);
    return moduleRequire;
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

}

module.exports = Loader;
