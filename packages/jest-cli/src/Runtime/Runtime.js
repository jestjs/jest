/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const constants = require('../constants');
const fs = require('graceful-fs');
const moduleMocker = require('jest-mock');
const path = require('path');
const transform = require('../lib/transform');

const mockParentModule = {
  id: 'mockParent',
  exports: {},
};

const normalizedIDCache = Object.create(null);
const unmockRegExpCache = new WeakMap();

class Runtime {
  constructor(config, environment, resolver) {
    this._config = config;
    this._environment = environment;
    this._resolver = resolver;

    this._coverageCollectors = Object.create(null);
    this._currentlyExecutingModulePath = '';
    this._explicitShouldMock = Object.create(null);
    this._isCurrentlyExecutingManualMock = null;
    this._mockFactories = Object.create(null);
    this._shouldAutoMock = config.automock;
    this._testRegex = new RegExp(config.testRegex.replace(/\//g, path.sep));

    this._mockMetaDataCache = Object.create(null);
    this._shouldMockModuleCache = Object.create(null);
    this._shouldUnmockTransitiveDependenciesCache = Object.create(null);
    this._transitiveShouldMock = Object.create(null);

    if (config.collectCoverage) {
      this._CoverageCollector = require(config.coverageCollector);
    }

    this._unmockList = unmockRegExpCache.get(config);
    if (!this._unmockList && config.unmockedModulePathPatterns) {
      this._unmockList =
        new RegExp(config.unmockedModulePathPatterns.join('|'));
      unmockRegExpCache.set(config, this._unmockList);
    }

    const unmockPath = filePath => {
      if (filePath && filePath.includes(constants.NODE_MODULES)) {
        const moduleID = this._getNormalizedModuleID(filePath);
        this._transitiveShouldMock[moduleID] = false;
      }
    };

    unmockPath(config.setupEnvScriptFile);
    config.setupFiles.forEach(unmockPath);

    this.resetModuleRegistry();
  }

  requireModule(from, moduleName) {
    const moduleID = this._getNormalizedModuleID(from, moduleName);
    let modulePath;

    // Some old tests rely on this mocking behavior. Ideally we'll change this
    // to be more explicit.
    let manualMockResource = null;
    let moduleResource = null;
    moduleResource = this._resolver.getModule(moduleName);
    manualMockResource = this._resolver.getMockModule(moduleName);
    if (
      !moduleResource &&
      manualMockResource &&
      manualMockResource !== this._isCurrentlyExecutingManualMock &&
      this._explicitShouldMock[moduleID] !== false
    ) {
      modulePath = manualMockResource;
    }

    if (this._resolver.isCoreModule(moduleName)) {
      return require(moduleName);
    }

    if (!modulePath) {
      modulePath = this._resolveModule(from, moduleName);
    }

    if (!this._moduleRegistry[modulePath]) {
      // We must register the pre-allocated module object first so that any
      // circular dependencies that may arise while evaluating the module can
      // be satisfied.
      const localModule = {
        filename: modulePath,
        exports: {},
      };

      this._moduleRegistry[modulePath] = localModule;
      if (path.extname(modulePath) === '.json') {
        localModule.exports = this._environment.global.JSON.parse(
          fs.readFileSync(modulePath, 'utf8')
        );
      } else if (path.extname(modulePath) === '.node') {
        localModule.exports = require(modulePath);
      } else {
        this._execModule(localModule);
      }
    }
    return this._moduleRegistry[modulePath].exports;
  }

  requireMock(from, moduleName) {
    const moduleID = this._getNormalizedModuleID(from, moduleName);

    if (this._mockRegistry[moduleID]) {
      return this._mockRegistry[moduleID];
    }

    if (moduleID in this._mockFactories) {
      return this._mockRegistry[moduleID] = this._mockFactories[moduleID]();
    }

    let manualMockResource = this._resolver.getMockModule(moduleName);
    let modulePath;
    if (manualMockResource) {
      modulePath = this._resolveModule(from, manualMockResource);
    } else {
      modulePath = this._resolveModule(from, moduleName);

      // If the actual module file has a __mocks__ dir sitting immediately next
      // to it, look to see if there is a manual mock for this file.
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

    if (manualMockResource) {
      const localModule = {
        exports: {},
        filename: modulePath,
      };
      this._execModule(localModule);
      this._mockRegistry[moduleID] = localModule.exports;
    } else {
      // Look for a real module to generate an automock from
      this._mockRegistry[moduleID] = this._generateMock(from, moduleName);
    }

    return this._mockRegistry[moduleID];
  }

  requireModuleOrMock(from, moduleName) {
    if (this._shouldMock(from, moduleName)) {
      return this.requireMock(from, moduleName);
    } else {
      return this.requireModule(from, moduleName);
    }
  }

  resetModuleRegistry() {
    this._mockRegistry = Object.create(null);
    this._moduleRegistry = Object.create(null);

    if (this._environment && this._environment.global) {
      const envGlobal = this._environment.global;
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

  _resolveModule(from, to) {
    return to ? this._resolver.resolveModule(from, to) : from;
  }

  _execModule(localModule) {
    // If the environment was disposed, prevent this module from
    // being executed.
    if (!this._environment.global) {
      return;
    }

    const filename = localModule.filename;
    const collectors = this._coverageCollectors;
    const collectOnlyFrom = this._config.collectCoverageOnlyFrom;
    const shouldCollectCoverage = (
      (this._config.collectCoverage && !collectOnlyFrom) ||
      (collectOnlyFrom && collectOnlyFrom[filename])
    );
    let moduleContent = transform(filename, this._config);
    let collectorStore;
    if (
      shouldCollectCoverage &&
      !filename.includes(constants.NODE_MODULES) &&
      !this._testRegex.test(filename)
    ) {
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

    const dirname = path.dirname(filename);
    localModule.children = [];
    localModule.parent = mockParentModule;
    localModule.paths = this._resolver.getModulePaths(dirname);
    localModule.require = this._createRequireImplementation(filename);

    const wrapperFunc = this._runSourceText(moduleContent, filename);
    wrapperFunc.call(
      localModule.exports, // module context
      localModule, // module object
      localModule.exports, // module exports
      localModule.require, // require implementation
      dirname, // __dirname
      filename, // __filename
      this._environment.global, // global object
      this._createRuntimeFor(filename), // jest object
      collectorStore // the coverage object
    );

    this._isCurrentlyExecutingManualMock = origCurrExecutingManualMock;
    this._currentlyExecutingModulePath = lastExecutingModulePath;
  }

  _runSourceText(moduleContent, filename) {
    /* eslint-disable max-len */
    const config = this._config;
    const relative = filePath => path.relative(config.rootDir, filePath);
    const env = this._environment;
    const evalResultVariable = 'Object.<anonymous>';
    const wrapper = '({ "' + evalResultVariable + '": function(module, exports, require, __dirname, __filename, global, jest, $JEST_COVERAGE_DATA) {' + moduleContent + '\n}});';
    try {
      return env.runSourceText(wrapper, filename)[evalResultVariable];
    } catch (e) {
      if (e.constructor.name === 'SyntaxError') {
        const hasPreprocessor = config.scriptPreprocessor;
        const preprocessorInfo = hasPreprocessor
          ? relative(config.scriptPreprocessor)
          : `No preprocessor specified, consider installing 'babel-jest'`;
        const babelInfo = config.usesBabelJest
          ? `Make sure your '.babelrc' is set up correctly, ` +
            `for example it should include the 'es2015' preset.\n`
          : '';
        throw new SyntaxError(
          `${e.message} in file '${relative(filename)}'.\n\n` +
          `Make sure your preprocessor is set up correctly and ensure ` +
          `your 'preprocessorIgnorePatterns' configuration is correct: http://facebook.github.io/jest/docs/api.html#preprocessorignorepatterns-array-string\n` +
          'If you are currently setting up Jest or modifying your preprocessor, try `jest --no-cache`.\n' +
          `Preprocessor: ${preprocessorInfo}.\n${babelInfo}` +
          `Jest tried to the execute the following ${hasPreprocessor ? 'preprocessed ' : ''}code:\n${moduleContent}\n`
        );
      }
      throw e;
    }
    /* eslint-enable max-len */
  }

  _generateMock(from, moduleName) {
    const modulePath = this._resolveModule(from, moduleName);

    if (!(modulePath in this._mockMetaDataCache)) {
      // This allows us to handle circular dependencies while generating an
      // automock
      this._mockMetaDataCache[modulePath] = moduleMocker.getMetadata({});

      // In order to avoid it being possible for automocking to potentially
      // cause side-effects within the module environment, we need to execute
      // the module in isolation. This could cause issues if the module being
      // mocked has calls into side-effectful APIs on another module.
      const origMockRegistry = this._mockRegistry;
      const origModuleRegistry = this._moduleRegistry;
      this._mockRegistry = Object.create(null);
      this._moduleRegistry = Object.create(null);

      const moduleExports = this.requireModule(from, moduleName);

      // Restore the "real" module/mock registries
      this._mockRegistry = origMockRegistry;
      this._moduleRegistry = origModuleRegistry;

      const mockMetadata = moduleMocker.getMetadata(moduleExports);
      if (mockMetadata === null) {
        throw new Error(
          `Failed to get mock metadata: ${modulePath}\n\n` +
          `See: http://facebook.github.io/jest/docs/manual-mocks.html#content`
        );
      }
      this._mockMetaDataCache[modulePath] = mockMetadata;
    }
    return moduleMocker.generateFromMetadata(
      this._mockMetaDataCache[modulePath]
    );
  }

  _getNormalizedModuleID(from, moduleName) {
    const key = from + path.delimiter + moduleName;
    if (normalizedIDCache[key]) {
      return normalizedIDCache[key];
    }

    let moduleType;
    let mockPath = null;
    let absolutePath = null;

    if (this._resolver.isCoreModule(moduleName)) {
      moduleType = 'node';
      absolutePath = moduleName;
    } else {
      moduleType = 'user';
      if (
        !this._resolver.getModule(moduleName) &&
        !this._resolver.getMockModule(moduleName)
      ) {
        absolutePath = this._resolveModule(from, moduleName);
        // Look up if this module has an associated manual mock.
        const mockModule = this._resolver.getMockModule(moduleName);
        if (mockModule) {
          mockPath = mockModule;
        }
      }

      if (absolutePath === null) {
        const moduleResource = this._resolver.getModule(moduleName);
        if (moduleResource) {
          absolutePath = moduleResource;
        }
      }

      if (mockPath === null) {
        const mockResource = this._resolver.getMockModule(moduleName);
        if (mockResource) {
          mockPath = mockResource;
        }
      }
    }

    const delimiter = path.delimiter;
    const id = moduleType + delimiter + absolutePath + delimiter + mockPath;
    normalizedIDCache[key] = id;
    return id;
  }

  _shouldMock(from, moduleName) {
    const explicitShouldMock = this._explicitShouldMock;
    const moduleID = this._getNormalizedModuleID(from, moduleName);
    const key = from + path.delimiter + moduleID;

    if (moduleID in explicitShouldMock) {
      return explicitShouldMock[moduleID];
    }

    if (
      !this._shouldAutoMock ||
      this._resolver.isCoreModule(moduleName) ||
      this._shouldUnmockTransitiveDependenciesCache[key]
    ) {
      return false;
    }

    if (moduleID in this._shouldMockModuleCache) {
      return this._shouldMockModuleCache[moduleID];
    }

    const manualMockResource = this._resolver.getMockModule(moduleName);
    let modulePath;
    try {
      modulePath = this._resolveModule(from, moduleName);
    } catch (e) {
      if (manualMockResource) {
        this._shouldMockModuleCache[moduleID] = true;
        return true;
      }
      throw e;
    }

    if (this._unmockList && this._unmockList.test(modulePath)) {
      this._shouldMockModuleCache[moduleID] = false;
      return false;
    }

    // transitive unmocking for package managers that store flat packages (npm3)
    const currentModuleID = this._getNormalizedModuleID(from);
    if (
      from.includes(constants.NODE_MODULES) &&
      modulePath.includes(constants.NODE_MODULES) &&
      (
        (this._unmockList && this._unmockList.test(from)) ||
        explicitShouldMock[currentModuleID] === false ||
        this._transitiveShouldMock[currentModuleID] === false
      )
    ) {
      this._transitiveShouldMock[moduleID] = false;
      this._shouldUnmockTransitiveDependenciesCache[key] = true;
      return false;
    }

    return this._shouldMockModuleCache[moduleID] = true;
  }

  _createRequireImplementation(from) {
    const moduleRequire = this.requireModuleOrMock.bind(this, from);
    moduleRequire.requireMock = this.requireMock.bind(this, from);
    moduleRequire.requireActual = this.requireModule.bind(this, from);
    moduleRequire.resolve = moduleName => this._resolveModule(from, moduleName);
    moduleRequire.cache = Object.create(null);
    moduleRequire.extensions = Object.create(null);
    return moduleRequire;
  }

  _createRuntimeFor(from) {
    const disableAutomock = () => {
      this._shouldAutoMock = false;
      return runtime;
    };
    const enableAutomock = () => {
      this._shouldAutoMock = true;
      return runtime;
    };
    const unmock = moduleName => {
      const moduleID = this._getNormalizedModuleID(from, moduleName);
      this._explicitShouldMock[moduleID] = false;
      return runtime;
    };
    const mock = (moduleName, mockFactory) => {
      if (mockFactory !== undefined) {
        return setMockFactory(moduleName, mockFactory);
      }

      const moduleID = this._getNormalizedModuleID(from, moduleName);
      this._explicitShouldMock[moduleID] = true;
      return runtime;
    };
    const setMockFactory = (moduleName, mockFactory) => {
      const moduleID = this._getNormalizedModuleID(from, moduleName);
      this._explicitShouldMock[moduleID] = true;
      this._mockFactories[moduleID] = mockFactory;
      return runtime;
    };
    const useFakeTimers = () => {
      this._environment.fakeTimers.useFakeTimers();
      return runtime;
    };
    const useRealTimers = () => {
      this._environment.fakeTimers.useRealTimers();
      return runtime;
    };

    const runtime = {
      addMatchers: matchers => {
        const jasmine = this._environment.global.jasmine;
        const addMatchers =
          jasmine.addMatchers || jasmine.getEnv().currentSpec.addMatchers;
        addMatchers(matchers);
      },

      autoMockOff: disableAutomock,
      disableAutomock,

      autoMockOn: enableAutomock,
      enableAutomock,

      clearAllTimers: () => this._environment.fakeTimers.clearAllTimers(),
      currentTestPath: () => this._environment.testFilePath,

      dontMock: unmock,
      unmock,

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

      genMockFromModule: moduleName => this._generateMock(from, moduleName),
      genMockFunction: moduleMocker.getMockFunction,
      genMockFn: moduleMocker.getMockFunction,
      fn() {
        const fn = moduleMocker.getMockFunction();
        if (arguments.length > 0) {
          return fn.mockImplementation(arguments[0]);
        }
        return fn;
      },

      doMock: mock,
      mock,

      resetModuleRegistry: () => {
        this.resetModuleRegistry();
        return runtime;
      },

      runAllTicks: () => this._environment.fakeTimers.runAllTicks(),
      runAllImmediates: () => this._environment.fakeTimers.runAllImmediates(),
      runAllTimers: () => this._environment.fakeTimers.runAllTimers(),
      runOnlyPendingTimers: () =>
        this._environment.fakeTimers.runOnlyPendingTimers(),

      setMock: (moduleName, mock) => setMockFactory(moduleName, () => mock),

      useFakeTimers,
      useRealTimers,
    };
    return runtime;
  }

}

module.exports = Runtime;
