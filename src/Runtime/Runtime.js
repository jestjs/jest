/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const H = require('jest-haste-map').H;

const constants = require('../constants');
const fs = require('graceful-fs');
const moduleMocker = require('jest-mock');
const nodeModulesPaths = require('resolve/lib/node-modules-paths');
const path = require('path');
const resolve = require('resolve');
const resolveNodeModule = require('../lib/resolveNodeModule');
const transform = require('../lib/transform');

const mockParentModule = {
  id: 'mockParent',
  exports: {},
};

const moduleNameCache = Object.create(null);
const modulePathCache = Object.create(null);
const normalizedIDCache = Object.create(null);
const unmockRegExpCache = new WeakMap();

const getModulePaths = from => {
  if (!modulePathCache[from]) {
    const paths = nodeModulesPaths(from, {});
    if (paths[paths.length - 1] === undefined) {
      // circumvent node-resolve bug that adds `undefined` as last item.
      paths.pop();
    }
    modulePathCache[from] = paths;
  }
  return modulePathCache[from];
};

class Runtime {
  constructor(config, environment, moduleMap) {
    this._config = config;
    this._coverageCollectors = Object.create(null);
    this._currentlyExecutingModulePath = '';
    this._environment = environment;
    this._explicitShouldMock = Object.create(null);
    this._mockFactories = Object.create(null);
    this._isCurrentlyExecutingManualMock = null;
    this._testDirectoryName = path.sep + config.testDirectoryName + path.sep;

    this._shouldAutoMock = config.automock;
    this._extensions = config.moduleFileExtensions.map(ext => '.' + ext);
    this._defaultPlatform = config.haste.defaultPlatform;

    this._modules = moduleMap.map;
    this._mocks = moduleMap.mocks;

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

    if (moduleID in this._mockRegistry) {
      return this._mockRegistry[moduleID];
    }

    if (moduleID in this._mockFactories) {
      return this._mockRegistry[moduleID] = this._mockFactories[moduleID]();
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

    if (manualMockResource) {
      const moduleObj = {
        exports: {},
        __filename: modulePath,
      };
      this._execModule(moduleObj);
      this._mockRegistry[moduleID] = moduleObj.exports;
    } else {
      // Look for a real module to generate an automock from
      this._mockRegistry[moduleID] = this._generateMock(
        currPath,
        moduleName
      );
    }

    return this._mockRegistry[moduleID];
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
    if (
      shouldCollectCoverage &&
      !filename.includes(this._testDirectoryName) &&
      !filename.includes(constants.NODE_MODULES)
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
    moduleObj.children = [];
    moduleObj.parent = mockParentModule;
    moduleObj.paths = getModulePaths(dirname);
    moduleObj.require = this._createRequireImplementation(filename);

    const wrapperFunc = this._runSourceText(moduleContent, filename);
    wrapperFunc.call(
      moduleObj.exports, // module context
      moduleObj, // module object
      moduleObj.exports, // module exports
      moduleObj.require, // require implementation
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

  _resolveModuleName(currPath, moduleName) {
    // Check if the resolver knows about this module
    const module = this._getModule(moduleName);
    if (module) {
      return module;
    }

    // Otherwise it is likely a node_module.
    const key = currPath + path.delimiter + moduleName;
    if (moduleNameCache[key]) {
      return moduleNameCache[key];
    }
    moduleNameCache[key] = this._resolveNodeModule(currPath, moduleName);
    return moduleNameCache[key];
  }

  _resolveNodeModule(currPath, moduleName) {
    if (!moduleName) {
      return currPath;
    }

    const basedir = path.dirname(currPath);
    const filePath = resolveNodeModule(moduleName, basedir, this._extensions);
    if (filePath) {
      return filePath;
    }

    // haste packages are `package.json` files outside of `node_modules`
    // folders.
    const parts = moduleName.split('/');
    const hastePackageName = parts.shift();
    const module = this._getPackage(hastePackageName);
    if (module) {
      try {
        return require.resolve(
          path.join.apply(path, [path.dirname(module)].concat(parts))
        );
      } catch (ignoredError) {}
    }

    // resolveNodeModule and resolve.sync use the basedir instead of currPath
    // and therefore can't throw an accurate error message.
    const relativePath = path.relative(basedir, currPath);
    throw new Error(
      `Cannot find module '${moduleName}' from '${relativePath || '.'}'`
    );
  }

  _getModule(name, type) {
    if (!type) {
      type = H.MODULE;
    }

    const map = this._modules[name];
    if (map) {
      const module = map[this._defaultPlatform] || map[H.GENERIC_PLATFORM];
      if (module && module[H.TYPE] == type) {
        return module[H.PATH];
      }
    }

    return null;
  }

  _getPackage(name) {
    return this._getModule(name, H.PACKAGE);
  }

  _getMockModule(name) {
    if (this._mocks[name]) {
      return this._mocks[name];
    } else {
      const moduleName = this._resolveStubModuleName(name);
      if (moduleName) {
        return this._getModule(moduleName) || moduleName;
      }
    }
  }

  _getNormalizedModuleID(currPath, moduleName) {
    const key = currPath + path.delimiter + moduleName;
    if (normalizedIDCache[key]) {
      return normalizedIDCache[key];
    }

    let moduleType;
    let mockPath = null;
    let absolutePath = null;

    if (resolve.isCore(moduleName)) {
      moduleType = 'node';
      absolutePath = moduleName;
    } else {
      moduleType = 'user';
      if (!this._getModule(moduleName) && !this._getMockModule(moduleName)) {
        absolutePath = this._resolveModuleName(currPath, moduleName);
        // Look up if this module has an associated manual mock.
        const mockModule = this._getMockModule(moduleName);
        if (mockModule) {
          mockPath = mockModule;
        }
      }

      if (absolutePath === null) {
        const moduleResource = this._getModule(moduleName);
        if (moduleResource) {
          absolutePath = moduleResource;
        }
      }

      if (mockPath === null) {
        const mockResource = this._getMockModule(moduleName);
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

  _shouldMock(currPath, moduleName) {
    const explicitShouldMock = this._explicitShouldMock;
    const moduleID = this._getNormalizedModuleID(currPath, moduleName);
    const key = currPath + path.delimiter + moduleID;

    if (moduleID in explicitShouldMock) {
      return explicitShouldMock[moduleID];
    }

    if (
      !this._shouldAutoMock ||
      resolve.isCore(moduleName) ||
      this._shouldUnmockTransitiveDependenciesCache[key]
    ) {
      return false;
    }

    if (moduleName in this._shouldMockModuleCache) {
      return this._shouldMockModuleCache[moduleName];
    }

    const manualMockResource = this._getMockModule(moduleName);
    let modulePath;
    try {
      modulePath = this._resolveModuleName(currPath, moduleName);
    } catch (e) {
      if (manualMockResource) {
        this._shouldMockModuleCache[moduleName] = true;
        return true;
      }
      throw e;
    }

    if (this._unmockList && this._unmockList.test(modulePath)) {
      this._shouldMockModuleCache[moduleName] = false;
      return false;
    }

    // transitive unmocking for package managers that store flat packages (npm3)
    const currentModuleID = this._getNormalizedModuleID(currPath);
    if (
      currPath.includes(constants.NODE_MODULES) &&
      modulePath.includes(constants.NODE_MODULES) &&
      (
        (this._unmockList && this._unmockList.test(currPath)) ||
        explicitShouldMock[currentModuleID] === false ||
        this._transitiveShouldMock[currentModuleID] === false
      )
    ) {
      this._transitiveShouldMock[moduleID] = false;
      this._shouldUnmockTransitiveDependenciesCache[key] = true;
      return false;
    }

    return this._shouldMockModuleCache[moduleName] = true;
  }

  _resolveStubModuleName(moduleName) {
    const nameMapper = this._mappedModuleNames;
    for (const mappedModuleName in nameMapper) {
      const regex = nameMapper[mappedModuleName];
      if (regex.test(moduleName)) {
        return moduleName.replace(regex, mappedModuleName);
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
    const disableAutomock = () => {
      this._shouldAutoMock = false;
      return runtime;
    };
    const enableAutomock = () => {
      this._shouldAutoMock = true;
      return runtime;
    };
    const unmock = moduleName => {
      const moduleID = this._getNormalizedModuleID(currPath, moduleName);
      this._explicitShouldMock[moduleID] = false;
      return runtime;
    };
    const mock = (moduleName, mockFactory) => {
      if (mockFactory !== undefined) {
        return setMockFactory(moduleName, mockFactory);
      }

      const moduleID = this._getNormalizedModuleID(currPath, moduleName);
      this._explicitShouldMock[moduleID] = true;
      return runtime;
    };
    const setMockFactory = (moduleName, mockFactory) => {
      const moduleID = this._getNormalizedModuleID(currPath, moduleName);
      this._explicitShouldMock[moduleID] = true;
      this._mockFactories[moduleID] = mockFactory;
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

      genMockFromModule: moduleName => this._generateMock(currPath, moduleName),
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

      useFakeTimers: () => this._environment.fakeTimers.useFakeTimers(),
      useRealTimers: () => this._environment.fakeTimers.useRealTimers(),
    };
    return runtime;
  }

}

module.exports = Runtime;
