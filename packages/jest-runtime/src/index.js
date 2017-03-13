/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {Config, Path} from 'types/Config';
import type {Console} from 'console';
import type {Environment} from 'types/Environment';
import type {HasteContext} from 'types/HasteMap';
import type {ModuleMap} from 'jest-haste-map';
import type {MockFunctionMetadata, ModuleMocker} from 'types/Mock';

const HasteMap = require('jest-haste-map');
const Resolver = require('jest-resolve');

const {createDirectory} = require('jest-util');
const {escapePathForRegex} = require('jest-regex-util');
const fs = require('graceful-fs');
const path = require('path');
const shouldInstrument = require('./shouldInstrument');
const stripBOM = require('strip-bom');
const transform = require('./transform');

type Module = {|
  children?: Array<any>,
  exports: any,
  filename: string,
  id: string,
  parent?: Module,
  paths?: Array<Path>,
  require?: Function,
|};

type HasteMapOptions = {|
  console?: Console,
  maxWorkers: number,
  resetCache: boolean,
  watch?: boolean,
|};

type InternalModuleOptions = {|
  isInternalModule: boolean,
|};

type BooleanObject = {[key: string]: boolean};
type CacheFS = {[path: Path]: string};

const NODE_MODULES = path.sep + 'node_modules' + path.sep;
const SNAPSHOT_EXTENSION = 'snap';

const getModuleNameMapper = (config: Config) => {
  if (config.moduleNameMapper.length) {
    return config.moduleNameMapper.map(([regex, moduleName]) => {
      return {moduleName, regex: new RegExp(regex)};
    });
  }
  return null;
};

const mockParentModule = {
  exports: {},
  filename: 'mock.js',
  id: 'mockParent',
};

const unmockRegExpCache = new WeakMap();

class Runtime {
  _cacheFS: CacheFS;
  _config: Config;
  _currentlyExecutingModulePath: string;
  _environment: Environment;
  _explicitShouldMock: BooleanObject;
  _isCurrentlyExecutingManualMock: ?string;
  _mockFactories: {[key: string]: () => any};
  _mockMetaDataCache: {[key: string]: MockFunctionMetadata};
  _mockRegistry: {[key: string]: any};
  _moduleMocker: ModuleMocker;
  _moduleRegistry: {[key: string]: Module};
  _internalModuleRegistry: {[key: string]: Module};
  _resolver: Resolver;
  _shouldAutoMock: boolean;
  _shouldMockModuleCache: BooleanObject;
  _shouldUnmockTransitiveDependenciesCache: BooleanObject;
  _sourceMapRegistry: {[key: string]: string};
  _transitiveShouldMock: BooleanObject;
  _unmockList: ?RegExp;
  _virtualMocks: BooleanObject;

  constructor(
    config: Config,
    environment: Environment,
    resolver: Resolver,
    cacheFS?: CacheFS,
  ) {
    this._moduleRegistry = Object.create(null);
    this._internalModuleRegistry = Object.create(null);
    this._mockRegistry = Object.create(null);
    this._sourceMapRegistry = Object.create(null);
    this._cacheFS = cacheFS || Object.create(null);
    this._config = config;
    this._environment = environment;
    this._resolver = resolver;
    this._moduleMocker = this._environment.moduleMocker;

    this._currentlyExecutingModulePath = '';
    this._explicitShouldMock = Object.create(null);
    this._isCurrentlyExecutingManualMock = null;
    this._mockFactories = Object.create(null);
    this._shouldAutoMock = config.automock;
    this._virtualMocks = Object.create(null);

    this._mockMetaDataCache = Object.create(null);
    this._shouldMockModuleCache = Object.create(null);
    this._shouldUnmockTransitiveDependenciesCache = Object.create(null);
    this._transitiveShouldMock = Object.create(null);

    this._unmockList = unmockRegExpCache.get(config);
    if (
      !this._unmockList && config.automock && config.unmockedModulePathPatterns
    ) {
      this._unmockList = new RegExp(
        config.unmockedModulePathPatterns.join('|'),
      );
      unmockRegExpCache.set(config, this._unmockList);
    }

    if (config.automock) {
      config.setupFiles.forEach(filePath => {
        if (filePath && filePath.includes(NODE_MODULES)) {
          const moduleID = this._resolver.getModuleID(
            this._virtualMocks,
            filePath,
          );
          this._transitiveShouldMock[moduleID] = false;
        }
      });
    }

    this.resetModules();

    if (config.setupFiles.length) {
      for (let i = 0; i < config.setupFiles.length; i++) {
        this.requireModule(config.setupFiles[i]);
      }
    }
  }

  static shouldInstrument(filename: Path, config: Config) {
    return shouldInstrument(filename, config);
  }

  static transformSource(
    filename: Path,
    config: Config,
    content: string,
    instrument: boolean,
  ) {
    return transform.transformSource(filename, config, content, instrument);
  }

  static createHasteContext(
    config: Config,
    options: {
      console?: Console,
      maxWorkers: number,
      watch?: boolean,
    },
  ): Promise<HasteContext> {
    createDirectory(config.cacheDirectory);
    const instance = Runtime.createHasteMap(config, {
      console: options.console,
      maxWorkers: options.maxWorkers,
      resetCache: !config.cache,
      watch: options.watch,
    });
    return instance.build().then(
      hasteMap => ({
        hasteFS: hasteMap.hasteFS,
        moduleMap: hasteMap.moduleMap,
        resolver: Runtime.createResolver(config, hasteMap.moduleMap),
      }),
      error => {
        throw error;
      },
    );
  }

  static createHasteMap(config: Config, options?: HasteMapOptions): HasteMap {
    const ignorePattern = new RegExp(
      [config.cacheDirectory].concat(config.modulePathIgnorePatterns).join('|'),
    );

    return new HasteMap({
      cacheDirectory: config.cacheDirectory,
      console: options && options.console,
      extensions: [SNAPSHOT_EXTENSION].concat(config.moduleFileExtensions),
      hasteImplModulePath: config.haste.hasteImplModulePath,
      ignorePattern,
      maxWorkers: (options && options.maxWorkers) || 1,
      mocksPattern: escapePathForRegex(path.sep + '__mocks__' + path.sep),
      name: config.name,
      platforms: config.haste.platforms || ['ios', 'android'],
      providesModuleNodeModules: config.haste.providesModuleNodeModules,
      resetCache: options && options.resetCache,
      retainAllFiles: false,
      roots: config.roots,
      useWatchman: config.watchman,
      watch: options && options.watch,
    });
  }

  static createResolver(config: Config, moduleMap: ModuleMap): Resolver {
    return new Resolver(moduleMap, {
      browser: config.browser,
      defaultPlatform: config.haste.defaultPlatform,
      extensions: config.moduleFileExtensions.map(extension => '.' + extension),
      hasCoreModules: true,
      moduleDirectories: config.moduleDirectories,
      moduleNameMapper: getModuleNameMapper(config),
      modulePaths: config.modulePaths,
      platforms: config.haste.platforms,
      resolver: config.resolver,
    });
  }

  static runCLI(args?: Object, info?: Array<string>) {
    return require('./cli').run(args, info);
  }

  static getCLIOptions() {
    return require('./cli/args').options;
  }

  requireModule(
    from: Path,
    moduleName?: string,
    options: ?InternalModuleOptions,
  ) {
    const moduleID = this._resolver.getModuleID(
      this._virtualMocks,
      from,
      moduleName,
    );
    let modulePath;

    const moduleRegistry = !options || !options.isInternalModule
      ? this._moduleRegistry
      : this._internalModuleRegistry;

    // Some old tests rely on this mocking behavior. Ideally we'll change this
    // to be more explicit.
    const moduleResource = moduleName && this._resolver.getModule(moduleName);
    const manualMock = moduleName &&
      this._resolver.getMockModule(from, moduleName);
    if (
      (!options || !options.isInternalModule) &&
      !moduleResource &&
      manualMock &&
      manualMock !== this._isCurrentlyExecutingManualMock &&
      this._explicitShouldMock[moduleID] !== false
    ) {
      modulePath = manualMock;
    }

    if (moduleName && this._resolver.isCoreModule(moduleName)) {
      // $FlowFixMe
      return require(moduleName);
    }

    if (!modulePath) {
      modulePath = this._resolveModule(from, moduleName);
    }

    if (!moduleRegistry[modulePath]) {
      // We must register the pre-allocated module object first so that any
      // circular dependencies that may arise while evaluating the module can
      // be satisfied.
      const localModule = {
        exports: {},
        filename: modulePath,
        id: modulePath,
      };
      moduleRegistry[modulePath] = localModule;
      if (path.extname(modulePath) === '.json') {
        localModule.exports = this._environment.global.JSON.parse(
          stripBOM(fs.readFileSync(modulePath, 'utf8')),
        );
      } else if (path.extname(modulePath) === '.node') {
        // $FlowFixMe
        localModule.exports = require(modulePath);
      } else {
        this._execModule(localModule, options);
      }
    }
    return moduleRegistry[modulePath].exports;
  }

  requireInternalModule(from: Path, to?: string) {
    return this.requireModule(from, to, {isInternalModule: true});
  }

  requireMock(from: Path, moduleName: string) {
    const moduleID = this._resolver.getModuleID(
      this._virtualMocks,
      from,
      moduleName,
    );

    if (this._mockRegistry[moduleID]) {
      return this._mockRegistry[moduleID];
    }

    if (moduleID in this._mockFactories) {
      return (this._mockRegistry[moduleID] = this._mockFactories[moduleID]());
    }

    let manualMock = this._resolver.getMockModule(from, moduleName);
    let modulePath;
    if (manualMock) {
      modulePath = this._resolveModule(from, manualMock);
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
      const potentialManualMock = path.join(
        moduleDir,
        '__mocks__',
        moduleFileName,
      );
      if (fs.existsSync(potentialManualMock)) {
        manualMock = true;
        modulePath = potentialManualMock;
      }
    }

    if (manualMock) {
      const localModule = {
        exports: {},
        filename: modulePath,
        id: modulePath,
      };
      this._execModule(localModule);
      this._mockRegistry[moduleID] = localModule.exports;
    } else {
      // Look for a real module to generate an automock from
      this._mockRegistry[moduleID] = this._generateMock(from, moduleName);
    }

    return this._mockRegistry[moduleID];
  }

  requireModuleOrMock(from: Path, moduleName: string) {
    if (this._shouldMock(from, moduleName)) {
      return this.requireMock(from, moduleName);
    } else {
      return this.requireModule(from, moduleName);
    }
  }

  resetModules() {
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
    return this._environment.global.__coverage__;
  }

  getSourceMapInfo() {
    return Object.keys(this._sourceMapRegistry).reduce(
      (result, sourcePath) => {
        if (fs.existsSync(this._sourceMapRegistry[sourcePath])) {
          result[sourcePath] = this._sourceMapRegistry[sourcePath];
        }
        return result;
      },
      {},
    );
  }

  setMock(
    from: string,
    moduleName: string,
    mockFactory: () => any,
    options?: {virtual: boolean},
  ) {
    if (options && options.virtual) {
      const mockPath = this._resolver.getModulePath(from, moduleName);
      this._virtualMocks[mockPath] = true;
    }
    const moduleID = this._resolver.getModuleID(
      this._virtualMocks,
      from,
      moduleName,
    );
    this._explicitShouldMock[moduleID] = true;
    this._mockFactories[moduleID] = mockFactory;
  }

  resetAllMocks() {
    this._moduleMocker.resetAllMocks();
  }

  clearAllMocks() {
    this._moduleMocker.clearAllMocks();
  }

  _resolveModule(from: Path, to?: ?string) {
    return to ? this._resolver.resolveModule(from, to) : from;
  }

  _execModule(localModule: Module, options: ?InternalModuleOptions) {
    // If the environment was disposed, prevent this module from being executed.
    if (!this._environment.global) {
      return;
    }

    const isInternalModule = !!(options && options.isInternalModule);
    const filename = localModule.filename;
    const lastExecutingModulePath = this._currentlyExecutingModulePath;
    this._currentlyExecutingModulePath = filename;
    const origCurrExecutingManualMock = this._isCurrentlyExecutingManualMock;
    this._isCurrentlyExecutingManualMock = filename;

    const dirname = path.dirname(filename);
    localModule.children = [];
    localModule.parent = mockParentModule;
    localModule.paths = this._resolver.getModulePaths(dirname);
    localModule.require = this._createRequireImplementation(filename, options);

    const transformedFile = transform(
      filename,
      this._config,
      {
        isInternalModule,
      },
      this._cacheFS[filename],
    );

    if (transformedFile.sourceMapPath) {
      this._sourceMapRegistry[filename] = transformedFile.sourceMapPath;
    }

    const wrapper = this._environment.runScript(transformedFile.script)[
      transform.EVAL_RESULT_VARIABLE
    ];
    wrapper.call(
      localModule.exports, // module context
      localModule, // module object
      localModule.exports, // module exports
      localModule.require, // require implementation
      dirname, // __dirname
      filename, // __filename
      this._environment.global, // global object
      this._createRuntimeFor(filename), // jest object
    );

    this._isCurrentlyExecutingManualMock = origCurrExecutingManualMock;
    this._currentlyExecutingModulePath = lastExecutingModulePath;
  }

  _generateMock(from: Path, moduleName: string) {
    const modulePath = this._resolveModule(from, moduleName);

    if (!(modulePath in this._mockMetaDataCache)) {
      // This allows us to handle circular dependencies while generating an
      // automock
      this._mockMetaDataCache[modulePath] = (this._moduleMocker.getMetadata({
      }): any);

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

      const mockMetadata = this._moduleMocker.getMetadata(moduleExports);
      if (mockMetadata == null) {
        throw new Error(
          `Failed to get mock metadata: ${modulePath}\n\n` +
            `See: http://facebook.github.io/jest/docs/manual-mocks.html#content`,
        );
      }
      this._mockMetaDataCache[modulePath] = mockMetadata;
    }
    return this._moduleMocker.generateFromMetadata(
      this._mockMetaDataCache[modulePath],
    );
  }

  _shouldMock(from: Path, moduleName: string) {
    const mockPath = this._resolver.getModulePath(from, moduleName);
    if (mockPath in this._virtualMocks) {
      return true;
    }

    const explicitShouldMock = this._explicitShouldMock;
    const moduleID = this._resolver.getModuleID(
      this._virtualMocks,
      from,
      moduleName,
    );
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

    let modulePath;
    try {
      modulePath = this._resolveModule(from, moduleName);
    } catch (e) {
      const manualMock = this._resolver.getMockModule(from, moduleName);
      if (manualMock) {
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
    const currentModuleID = this._resolver.getModuleID(
      this._virtualMocks,
      from,
    );
    if (
      this._transitiveShouldMock[currentModuleID] === false ||
      (from.includes(NODE_MODULES) &&
        modulePath.includes(NODE_MODULES) &&
        ((this._unmockList && this._unmockList.test(from)) ||
          explicitShouldMock[currentModuleID] === false))
    ) {
      this._transitiveShouldMock[moduleID] = false;
      this._shouldUnmockTransitiveDependenciesCache[key] = true;
      return false;
    }

    return (this._shouldMockModuleCache[moduleID] = true);
  }

  _createRequireImplementation(from: Path, options: ?InternalModuleOptions) {
    const moduleRequire = options && options.isInternalModule
      ? (moduleName: string) => this.requireInternalModule(from, moduleName)
      : this.requireModuleOrMock.bind(this, from);
    moduleRequire.cache = Object.create(null);
    moduleRequire.extensions = Object.create(null);
    moduleRequire.requireActual = this.requireModule.bind(this, from);
    moduleRequire.requireMock = this.requireMock.bind(this, from);
    moduleRequire.resolve = moduleName => this._resolveModule(from, moduleName);
    return moduleRequire;
  }

  _createRuntimeFor(from: Path) {
    const disableAutomock = () => {
      this._shouldAutoMock = false;
      return runtime;
    };
    const enableAutomock = () => {
      this._shouldAutoMock = true;
      return runtime;
    };
    const unmock = (moduleName: string) => {
      const moduleID = this._resolver.getModuleID(
        this._virtualMocks,
        from,
        moduleName,
      );
      this._explicitShouldMock[moduleID] = false;
      return runtime;
    };
    const deepUnmock = (moduleName: string) => {
      const moduleID = this._resolver.getModuleID(
        this._virtualMocks,
        from,
        moduleName,
      );
      this._explicitShouldMock[moduleID] = false;
      this._transitiveShouldMock[moduleID] = false;
      return runtime;
    };
    const mock = (
      moduleName: string,
      mockFactory: Object,
      options: {virtual: boolean},
    ) => {
      if (mockFactory !== undefined) {
        return setMockFactory(moduleName, mockFactory, options);
      }

      const moduleID = this._resolver.getModuleID(
        this._virtualMocks,
        from,
        moduleName,
      );
      this._explicitShouldMock[moduleID] = true;
      return runtime;
    };
    const setMockFactory = (moduleName, mockFactory, options) => {
      this.setMock(from, moduleName, mockFactory, options);
      return runtime;
    };
    const clearAllMocks = () => {
      this.clearAllMocks();
      return runtime;
    };
    const resetAllMocks = () => {
      this.resetAllMocks();
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
    const resetModules = () => {
      this.resetModules();
      return runtime;
    };
    const fn = this._moduleMocker.fn.bind(this._moduleMocker);
    const spyOn = this._moduleMocker.spyOn.bind(this._moduleMocker);

    const runtime = {
      addMatchers: (matchers: Object) =>
        this._environment.global.jasmine.addMatchers(matchers),

      autoMockOff: disableAutomock,
      autoMockOn: enableAutomock,
      clearAllMocks,
      clearAllTimers: () => this._environment.fakeTimers.clearAllTimers(),
      deepUnmock,
      disableAutomock,
      doMock: mock,
      dontMock: unmock,
      enableAutomock,
      fn,
      genMockFn: fn,
      genMockFromModule: (moduleName: string) =>
        this._generateMock(from, moduleName),
      genMockFunction: fn,
      isMockFunction: this._moduleMocker.isMockFunction,

      mock,
      resetAllMocks,
      resetModuleRegistry: resetModules,
      resetModules,

      runAllImmediates: () => this._environment.fakeTimers.runAllImmediates(),
      runAllTicks: () => this._environment.fakeTimers.runAllTicks(),
      runAllTimers: () => this._environment.fakeTimers.runAllTimers(),
      runOnlyPendingTimers: () =>
        this._environment.fakeTimers.runOnlyPendingTimers(),
      runTimersToTime: (msToRun: number) =>
        this._environment.fakeTimers.runTimersToTime(msToRun),

      setMock: (moduleName: string, mock: Object) =>
        setMockFactory(moduleName, () => mock),
      spyOn,

      unmock,

      useFakeTimers,
      useRealTimers,
    };
    return runtime;
  }
}

module.exports = Runtime;
