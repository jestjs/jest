/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import nativeModule from 'node:module';
import * as path from 'node:path';
import {SourceTextModule} from 'node:vm';
import * as fs from 'graceful-fs';
import slash from 'slash';
import type {Jest, JestEnvironment} from '@jest/environment';
import type {LegacyFakeTimers, ModernFakeTimers} from '@jest/fake-timers';
import type {expect} from '@jest/globals';
import type {SourceMapRegistry} from '@jest/source-map';
import type {TestContext, V8CoverageResult} from '@jest/test-result';
import {
  type ScriptTransformer,
  type ShouldInstrumentOptions,
  type TransformationOptions,
  shouldInstrument,
} from '@jest/transform';
import type {Config} from '@jest/types';
import HasteMap, {type IHasteMap, type IModuleMap} from 'jest-haste-map';
import {formatStackTrace, separateMessageFromStack} from 'jest-message-util';
import type {ModuleMocker} from 'jest-mock';
import {escapePathForRegex} from 'jest-regex-util';
import Resolver from 'jest-resolve';
import {EXTENSION as SnapshotExtension} from 'jest-snapshot';
import {createDirectory, deepCyclicCopy, invariant} from 'jest-util';
import {
  decodePossibleOutsideJestVmPath,
  findSiblingsWithFileExtension,
} from './helpers';
import {CjsExportsCache} from './internals/CjsExportsCache';
import {CjsLoader} from './internals/CjsLoader';
import {EsmLoader} from './internals/EsmLoader';
import {FileCache} from './internals/FileCache';
import {MockState} from './internals/MockState';
import {ModuleExecutor} from './internals/ModuleExecutor';
import {ModuleRegistries} from './internals/ModuleRegistries';
import {Resolution} from './internals/Resolution';
import {TestMainModule} from './internals/TestMainModule';
import {
  TransformCache,
  type TransformOptions,
} from './internals/TransformCache';
import {V8CoverageCollector} from './internals/V8CoverageCollector';
import {generateMock} from './internals/automock';
import {CoreModuleProvider, RequireBuilder} from './internals/cjsRequire';
import type {InitialModule, ModuleRegistry} from './internals/moduleTypes';
import {runtimeSupportsVmModules} from './internals/nodeCapabilities';
import type {JestGlobals, JestGlobalsWithJest} from './internals/types';

// Modules safe to require from the outside (not stateful, not prone to
// realm errors) and slow enough that paying the worker-cache hit is worth
// it. Internal context only — user `require()` from a test still goes
// through the VM.
const INTERNAL_MODULE_REQUIRE_OUTSIDE_OPTIMIZED_MODULES = new Set(['chalk']);

const esmIsAvailable = typeof SourceTextModule === 'function';

type HasteMapOptions = {
  console?: Console;
  maxWorkers: number;
  resetCache: boolean;
  watch?: boolean;
  watchman: boolean;
  workerThreads?: boolean;
};

const defaultTransformOptions: TransformOptions = {
  isInternalModule: false,
  supportsDynamicImport: esmIsAvailable,
  supportsExportNamespaceFrom: false,
  supportsStaticESM: false,
  supportsTopLevelAwait: false,
};

const testTimeoutSymbol = Symbol.for('TEST_TIMEOUT_SYMBOL');
const retryTimesSymbol = Symbol.for('RETRY_TIMES');
const waitBeforeRetrySymbol = Symbol.for('WAIT_BEFORE_RETRY');
const retryImmediatelySybmbol = Symbol.for('RETRY_IMMEDIATELY');
const logErrorsBeforeRetrySymbol = Symbol.for('LOG_ERRORS_BEFORE_RETRY');

const NODE_MODULES = `${path.sep}node_modules${path.sep}`;

const getModuleNameMapper = (config: Config.ProjectConfig) => {
  if (
    Array.isArray(config.moduleNameMapper) &&
    config.moduleNameMapper.length > 0
  ) {
    return config.moduleNameMapper.map(([regex, moduleName]) => ({
      moduleName,
      regex: new RegExp(regex),
    }));
  }
  return null;
};

export default class Runtime {
  private readonly fileCache: FileCache;
  private readonly _config: Config.ProjectConfig;
  private readonly _globalConfig: Config.GlobalConfig;
  private readonly _coverageOptions: ShouldInstrumentOptions;
  private readonly _environment: JestEnvironment;
  private readonly mockState: MockState;
  private _fakeTimersImplementation:
    | LegacyFakeTimers<unknown>
    | ModernFakeTimers
    | null;
  private readonly registries: ModuleRegistries;
  private readonly testMainModule: TestMainModule;
  private readonly requireBuilder: RequireBuilder;
  private readonly executor: ModuleExecutor;
  private readonly esmLoader: EsmLoader;
  private readonly cjsLoader: CjsLoader;
  private readonly _moduleMocker: ModuleMocker;
  private readonly cjsExportsCache: CjsExportsCache;
  private readonly _testPath: string;
  private readonly _resolution: Resolution;
  private readonly transformCache: TransformCache;
  private readonly v8Coverage: V8CoverageCollector;
  private readonly coreModule: CoreModuleProvider;
  private readonly jestObjectCaches: Map<string, Jest>;
  private jestGlobals?: JestGlobals;
  private testState: 'loading' | 'inTest' | 'betweenTests' | 'tornDown' =
    'loading';
  private readonly loggedReferenceErrors = new Set<string>();

  constructor(
    config: Config.ProjectConfig,
    environment: JestEnvironment,
    resolver: Resolver,
    transformer: ScriptTransformer,
    cacheFS: Map<string, string>,
    coverageOptions: ShouldInstrumentOptions,
    testPath: string,
    globalConfig: Config.GlobalConfig,
  ) {
    this.fileCache = new FileCache(cacheFS);
    this._config = config;
    this._coverageOptions = coverageOptions;
    this._environment = environment;
    this._globalConfig = globalConfig;
    this.registries = new ModuleRegistries();
    invariant(
      this._environment.moduleMocker,
      '`moduleMocker` must be set on an environment when created',
    );
    this._moduleMocker = this._environment.moduleMocker;
    this._testPath = testPath;
    this.transformCache = new TransformCache(
      transformer,
      this.fileCache,
      options => this._getFullTransformationOptions(options),
    );
    this.v8Coverage = new V8CoverageCollector(
      coverageOptions,
      config,
      this.transformCache,
    );
    this.jestObjectCaches = new Map();

    this._fakeTimersImplementation = config.fakeTimers.legacyFakeTimers
      ? this._environment.fakeTimers
      : this._environment.fakeTimersModern;

    this._resolution = new Resolution(
      resolver,
      this._environment.exportConditions?.() ?? [],
      config.extensionsToTreatAsEsm,
    );
    this.mockState = new MockState(this._resolution, config);
    this.cjsExportsCache = new CjsExportsCache(
      this._resolution,
      this.fileCache,
      modulePath => this.transformCache.getCachedSource(modulePath),
      (from, moduleName) => this.requireModule(from, moduleName),
      (from, moduleName) => this.requireModuleOrMock(from, moduleName),
    );
    // Construction is a DAG: testMainModule → requireBuilder → {coreModule,
    // executor} → cjsLoader. The two lambdas inside `requireBuilder`'s deps
    // close over `cjsLoader` (built last) and `this.requireModuleOrMock`,
    // but those callbacks aren't invoked until user code runs, so the
    // forward references are safe.
    this.testMainModule = new TestMainModule();
    this.requireBuilder = new RequireBuilder({
      registries: this.registries,
      requireDispatch: (from, moduleName) =>
        this.requireModuleOrMock(from, moduleName),
      requireInternal: (from, moduleName) =>
        this.requireInternalModule(from, moduleName),
      resolution: this._resolution,
      testMainModule: this.testMainModule,
    });
    this.coreModule = new CoreModuleProvider({
      environment: this._environment,
      requireBuilder: this.requireBuilder,
      resolution: this._resolution,
    });
    this.esmLoader = new EsmLoader({
      cjsExportsCache: this.cjsExportsCache,
      coreModule: this.coreModule,
      environment: this._environment,
      fileCache: this.fileCache,
      getEnvironmentGlobals: () => this.getGlobalsFromEnvironment(),
      getJestObject: from => this._getOrCreateJest(from),
      getTestState: () => this.testState,
      logFormattedReferenceError: msg => this._logFormattedReferenceError(msg),
      mockState: this.mockState,
      registries: this.registries,
      requireModuleOrMock: (from, moduleName) =>
        this.requireModuleOrMock(from, moduleName),
      resolution: this._resolution,
      shouldLoadAsEsm: modulePath => this.unstable_shouldLoadAsEsm(modulePath),
      transformCache: this.transformCache,
    });
    this.executor = new ModuleExecutor({
      config,
      dynamicImport: (specifier, identifier, context) =>
        this.esmLoader.dynamicImportFromCjs(specifier, identifier, context),
      environment: this._environment,
      jestObjectCache: this.jestObjectCaches,
      jestObjectFactory: from => this._createJestObjectFor(from),
      requireBuilder: this.requireBuilder,
      resolution: this._resolution,
      testMainModule: this.testMainModule,
      testPath,
      transformCache: this.transformCache,
    });
    this.cjsLoader = new CjsLoader({
      coreModule: this.coreModule,
      environment: this._environment,
      executor: this.executor,
      getTestState: () => this.testState,
      logFormattedReferenceError: msg => this._logFormattedReferenceError(msg),
      mockState: this.mockState,
      registries: this.registries,
      requireEsm: <T>(modulePath: string) =>
        this.esmLoader.requireEsmModule<T>(modulePath),
      resolution: this._resolution,
      transformCache: this.transformCache,
    });

    if (config.automock) {
      for (const filePath of config.setupFiles) {
        if (filePath.includes(NODE_MODULES)) {
          // shouldn't really matter, but in theory this will make sure the caching is correct
          const moduleID = this.unstable_shouldLoadAsEsm(filePath)
            ? this._resolution.getEsmModuleId(new Map(), filePath)
            : this._resolution.getCjsModuleId(new Map(), filePath);
          this.mockState.markTransitive(moduleID, false);
        }
      }
    }

    this.resetModules();
  }

  static shouldInstrument = shouldInstrument;

  static async createContext(
    config: Config.ProjectConfig,
    options: {
      console?: Console;
      maxWorkers: number;
      watch?: boolean;
      watchman: boolean;
    },
  ): Promise<TestContext> {
    createDirectory(config.cacheDirectory);
    const instance = await Runtime.createHasteMap(config, {
      console: options.console,
      maxWorkers: options.maxWorkers,
      resetCache: !config.cache,
      watch: options.watch,
      watchman: options.watchman,
    });
    const hasteMap = await instance.build();

    return {
      config,
      hasteFS: hasteMap.hasteFS,
      moduleMap: hasteMap.moduleMap,
      resolver: Runtime.createResolver(config, hasteMap.moduleMap),
    };
  }

  static createHasteMap(
    config: Config.ProjectConfig,
    options?: HasteMapOptions,
  ): Promise<IHasteMap> {
    const ignorePatternParts = [
      ...config.modulePathIgnorePatterns,
      ...(options && options.watch ? config.watchPathIgnorePatterns : []),
      config.cacheDirectory.startsWith(config.rootDir + path.sep) &&
        config.cacheDirectory,
    ].filter(Boolean);
    const ignorePattern =
      ignorePatternParts.length > 0
        ? new RegExp(ignorePatternParts.join('|'))
        : undefined;

    return HasteMap.create({
      cacheDirectory: config.cacheDirectory,
      computeSha1: config.haste.computeSha1,
      console: options?.console,
      dependencyExtractor: config.dependencyExtractor,
      enableSymlinks: config.haste.enableSymlinks,
      extensions: [SnapshotExtension, ...config.moduleFileExtensions],
      forceNodeFilesystemAPI: config.haste.forceNodeFilesystemAPI,
      hasteImplModulePath: config.haste.hasteImplModulePath,
      hasteMapModulePath: config.haste.hasteMapModulePath,
      id: config.id,
      ignorePattern,
      maxWorkers: options?.maxWorkers || 1,
      mocksPattern: escapePathForRegex(`${path.sep}__mocks__${path.sep}`),
      platforms: config.haste.platforms || ['ios', 'android'],
      resetCache: options?.resetCache,
      retainAllFiles: config.haste.retainAllFiles || false,
      rootDir: config.rootDir,
      roots: config.roots,
      throwOnModuleCollision: config.haste.throwOnModuleCollision,
      useWatchman: options?.watchman,
      watch: options?.watch,
      workerThreads: options?.workerThreads,
    });
  }

  static createResolver(
    config: Config.ProjectConfig,
    moduleMap: IModuleMap,
  ): Resolver {
    return new Resolver(moduleMap, {
      defaultPlatform: config.haste.defaultPlatform,
      extensions: config.moduleFileExtensions.map(extension => `.${extension}`),
      hasCoreModules: true,
      moduleDirectories: config.moduleDirectories,
      moduleNameMapper: getModuleNameMapper(config),
      modulePaths: config.modulePaths,
      platforms: config.haste.platforms,
      resolver: config.resolver,
      rootDir: config.rootDir,
    });
  }

  // unstable as it should be replaced by https://github.com/nodejs/modules/issues/393, and we don't want people to use it
  unstable_shouldLoadAsEsm(modulePath: string): boolean {
    return this._resolution.shouldLoadAsEsm(modulePath);
  }

  async unstable_importModule(
    from: string,
    moduleName?: string,
  ): Promise<unknown | void> {
    return this.esmLoader.loadAndEvaluate(from, moduleName);
  }

  requireModule<T = unknown>(
    from: string,
    moduleName?: string,
    options?: TransformOptions,
    isRequireActual = false,
  ): T {
    return this.cjsLoader.requireModule<T>(
      from,
      moduleName,
      options,
      isRequireActual,
    );
  }

  requireInternalModule<T = unknown>(from: string, to?: string): T {
    if (to) {
      const require = nativeModule.createRequire(from);
      if (INTERNAL_MODULE_REQUIRE_OUTSIDE_OPTIMIZED_MODULES.has(to)) {
        return require(to);
      }
      const outsideJestVmPath = decodePossibleOutsideJestVmPath(to);
      if (outsideJestVmPath) {
        return require(outsideJestVmPath);
      }
    }

    return this.requireModule<T>(from, to, {
      isInternalModule: true,
      supportsDynamicImport: runtimeSupportsVmModules,
      supportsExportNamespaceFrom: false,
      supportsStaticESM: false,
      supportsTopLevelAwait: false,
    });
  }

  requireActual<T = unknown>(from: string, moduleName: string): T {
    return this.requireModule<T>(from, moduleName, undefined, true);
  }

  requireMock<T = unknown>(from: string, moduleName: string): T {
    const moduleID = this.mockState.getCjsModuleId(from, moduleName);

    if (this.registries.hasMock(moduleID)) {
      return this.registries.getMock(moduleID) as T;
    }

    const mockRegistry = this.registries.getActiveMockRegistry();

    const factory = this.mockState.getCjsFactory(moduleID);
    if (factory) {
      const module = factory();
      mockRegistry.set(moduleID, module);
      return module as T;
    }

    /** Resolved mock module path from (potentially aliased) module name. */
    const manualMockPath: string | null = (() => {
      // Attempt to get manual mock path when moduleName is a:

      // A. Core module specifier i.e. ['fs', 'node:fs']:
      // Normalize then check for a root manual mock '<rootDir>/__mocks__/'
      if (this._resolution.isCoreModule(moduleName)) {
        const moduleWithoutNodePrefix =
          this._resolution.normalizeCoreModuleSpecifier(moduleName);
        return this._resolution.getCjsMockModule(from, moduleWithoutNodePrefix);
      }

      // B. Node module specifier i.e. ['jest', 'react']:
      // Look for root manual mock
      const rootMock = this._resolution.getCjsMockModule(from, moduleName);
      if (rootMock) return rootMock;

      // C. Relative/Absolute path:
      // If the actual module file has a __mocks__ dir sitting immediately next
      // to it, look to see if there is a manual mock for this file.
      //
      // subDir1/my_module.js
      // subDir1/__mocks__/my_module.js
      // subDir2/my_module.js
      // subDir2/__mocks__/my_module.js
      //
      // Where some other module does a relative require into each of the
      // respective subDir{1,2} directories and expects a manual mock
      // corresponding to that particular my_module.js file.
      const modulePath = this._resolution.resolveCjs(from, moduleName);
      const moduleDir = path.dirname(modulePath);
      const moduleFileName = path.basename(modulePath);
      const potentialManualMock = path.join(
        moduleDir,
        '__mocks__',
        moduleFileName,
      );
      if (fs.existsSync(potentialManualMock)) {
        return potentialManualMock;
      }

      return null;
    })();

    if (manualMockPath) {
      const localModule: InitialModule = {
        children: [],
        exports: {},
        filename: manualMockPath,
        id: manualMockPath,
        isPreloading: false,
        loaded: false,
        path: path.dirname(manualMockPath),
      };

      this.cjsLoader.loadModule(
        localModule,
        from,
        moduleName,
        manualMockPath,
        undefined,
        mockRegistry as ModuleRegistry,
      );

      mockRegistry.set(moduleID, localModule.exports);
    } else {
      // Look for a real module to generate an automock from
      mockRegistry.set(moduleID, this._generateMock(from, moduleName));
    }

    return mockRegistry.get(moduleID) as T;
  }

  private _getFullTransformationOptions(
    options: TransformOptions = defaultTransformOptions,
  ): TransformationOptions {
    return {...options, ...this._coverageOptions};
  }

  requireModuleOrMock<T = unknown>(from: string, moduleName: string): T {
    if (this.testState === 'tornDown') {
      this._logFormattedReferenceError(
        'You are trying to `require` a file after the Jest environment has been torn down.',
      );
      process.exitCode = 1;
      // @ts-expect-error: exiting early
      return;
    }

    // this module is unmockable
    if (moduleName === '@jest/globals') {
      // @ts-expect-error: we don't care that it's not assignable to T
      return this.getGlobalsForCjs(from);
    }

    try {
      if (this.mockState.shouldMockCjs(from, moduleName)) {
        return this.requireMock<T>(from, moduleName);
      } else {
        return this.requireModule<T>(from, moduleName);
      }
    } catch (error) {
      const moduleNotFound = Resolver.tryCastModuleNotFoundError(error);
      if (moduleNotFound) {
        if (
          moduleNotFound.siblingWithSimilarExtensionFound === null ||
          moduleNotFound.siblingWithSimilarExtensionFound === undefined
        ) {
          moduleNotFound.hint = findSiblingsWithFileExtension(
            this._config.moduleFileExtensions,
            from,
            moduleNotFound.moduleName || moduleName,
          );
          moduleNotFound.siblingWithSimilarExtensionFound = Boolean(
            moduleNotFound.hint,
          );
        }
        moduleNotFound.buildMessage(this._config.rootDir);
        throw moduleNotFound;
      }
      throw error;
    }
  }

  isolateModules(fn: () => void): void {
    this.registries.enterIsolated('isolateModules');
    try {
      fn();
    } finally {
      this.registries.exitIsolated();
    }
  }

  async isolateModulesAsync(fn: () => Promise<void>): Promise<void> {
    this.registries.enterIsolated('isolateModulesAsync');
    try {
      await fn();
    } finally {
      this.registries.exitIsolated();
    }
  }

  resetModules(): void {
    this.registries.clearForReset();
    this.cjsExportsCache.clear();
    this.fileCache.clear();
    this._resolution.clear();

    this.v8Coverage.snapshotTransforms();

    this.transformCache.clearForReset();

    if (this._environment) {
      if (this._environment.global) {
        const envGlobal = this._environment.global;
        for (const key of Object.keys(envGlobal) as Array<
          keyof typeof globalThis
        >) {
          const globalMock = envGlobal[key];
          if (
            ((typeof globalMock === 'object' && globalMock !== null) ||
              typeof globalMock === 'function') &&
            '_isMockFunction' in globalMock &&
            globalMock._isMockFunction === true
          ) {
            globalMock.mockClear();
          }
        }
      }

      if (this._environment.fakeTimers) {
        this._environment.fakeTimers.clearAllTimers();
      }
    }
  }

  collectV8Coverage(): Promise<void> {
    return this.v8Coverage.start();
  }

  stopCollectingV8Coverage(): Promise<void> {
    return this.v8Coverage.stop();
  }

  getAllCoverageInfoCopy(): JestEnvironment['global']['__coverage__'] {
    return deepCyclicCopy(this._environment.global.__coverage__);
  }

  getAllV8CoverageInfoCopy(): V8CoverageResult {
    return this.v8Coverage.getResult();
  }

  getSourceMaps(): SourceMapRegistry {
    return this.transformCache.getSourceMaps();
  }

  setMock(
    from: string,
    moduleName: string,
    mockFactory: () => unknown,
    options?: {virtual?: boolean},
  ): void {
    this.mockState.setMock(from, moduleName, mockFactory, options);
  }

  private setModuleMock(
    from: string,
    moduleName: string,
    mockFactory: () => Promise<unknown> | unknown,
    options?: {virtual?: boolean},
  ): void {
    this.mockState.setModuleMock(from, moduleName, mockFactory, options);
  }

  restoreAllMocks(): void {
    this._moduleMocker.restoreAllMocks();
  }

  resetAllMocks(): void {
    this._moduleMocker.resetAllMocks();
  }

  clearAllMocks(): void {
    this._moduleMocker.clearAllMocks();
  }

  enterTestCode(): void {
    this.testState = 'inTest';
  }

  leaveTestCode(): void {
    this.testState = 'betweenTests';
  }

  teardown(): void {
    this.restoreAllMocks();
    this.resetModules();

    this.registries.clear();
    this.testMainModule.reset();
    this.mockState.clear();
    this.fileCache.clear();

    this.transformCache.clear();
    this.jestObjectCaches.clear();

    this.v8Coverage.reset();
    this.coreModule.reset();

    this.testState = 'tornDown';
  }

  private _generateMock<T>(from: string, moduleName: string): T {
    return generateMock<T>(from, moduleName, {
      mockState: this.mockState,
      moduleMocker: this._moduleMocker,
      registries: this.registries,
      requireModule: (from, moduleName) => this.requireModule(from, moduleName),
      resolution: this._resolution,
    });
  }

  private _createJestObjectFor(from: string): Jest {
    const disableAutomock = () => {
      this.mockState.disableAutomock();
      return jestObject;
    };
    const enableAutomock = () => {
      this.mockState.enableAutomock();
      return jestObject;
    };
    const unmock = (moduleName: string) => {
      this.mockState.unmockCjs(from, moduleName);
      return jestObject;
    };
    const unmockModule = (moduleName: string) => {
      this.mockState.unmockEsm(from, moduleName);
      return jestObject;
    };
    const deepUnmock = (moduleName: string) => {
      this.mockState.deepUnmock(from, moduleName);
      return jestObject;
    };
    const mock: Jest['mock'] = (moduleName, mockFactory, options) => {
      if (mockFactory !== undefined) {
        return setMockFactory(moduleName, mockFactory, options);
      }
      this.mockState.markExplicitCjsMock(from, moduleName);
      return jestObject;
    };
    const onGenerateMock: Jest['onGenerateMock'] = <T>(
      cb: (moduleName: string, moduleMock: T) => T,
    ) => {
      this.mockState.addOnGenerateMock(cb);
      return jestObject;
    };
    const setMockFactory = (
      moduleName: string,
      mockFactory: () => unknown,
      options?: {virtual?: boolean},
    ) => {
      this.setMock(from, moduleName, mockFactory, options);
      return jestObject;
    };
    const mockModule: Jest['unstable_mockModule'] = (
      moduleName,
      mockFactory,
      options,
    ) => {
      if (typeof mockFactory !== 'function') {
        throw new TypeError(
          '`unstable_mockModule` must be passed a mock factory',
        );
      }

      this.setModuleMock(from, moduleName, mockFactory, options);
      return jestObject;
    };
    const clearAllMocks = () => {
      this.clearAllMocks();
      return jestObject;
    };
    const resetAllMocks = () => {
      this.resetAllMocks();
      return jestObject;
    };
    const restoreAllMocks = () => {
      this.restoreAllMocks();
      return jestObject;
    };
    const _getFakeTimers = () => {
      if (
        this.testState === 'tornDown' ||
        !(this._environment.fakeTimers || this._environment.fakeTimersModern)
      ) {
        this._logFormattedReferenceError(
          'You are trying to access a property or method of the Jest environment after it has been torn down.',
        );
        process.exitCode = 1;
      }
      if (this.testState === 'betweenTests') {
        throw new ReferenceError(
          'You are trying to access a property or method of the Jest environment outside of the scope of the test code.',
        );
      }

      return this._fakeTimersImplementation!;
    };
    const useFakeTimers: Jest['useFakeTimers'] = fakeTimersConfig => {
      fakeTimersConfig = {
        ...this._config.fakeTimers,
        ...fakeTimersConfig,
      } as Config.FakeTimersConfig;
      if (fakeTimersConfig?.legacyFakeTimers) {
        this._fakeTimersImplementation = this._environment.fakeTimers;
      } else {
        this._fakeTimersImplementation = this._environment.fakeTimersModern;
      }
      this._fakeTimersImplementation!.useFakeTimers(fakeTimersConfig);
      return jestObject;
    };
    const useRealTimers = () => {
      _getFakeTimers().useRealTimers();
      return jestObject;
    };
    const resetModules = () => {
      this.resetModules();
      return jestObject;
    };
    const isolateModules = (fn: () => void) => {
      this.isolateModules(fn);
      return jestObject;
    };
    const isolateModulesAsync = this.isolateModulesAsync.bind(this);
    const fn = this._moduleMocker.fn.bind(this._moduleMocker);
    const spyOn = this._moduleMocker.spyOn.bind(this._moduleMocker);
    const mocked = this._moduleMocker.mocked.bind(this._moduleMocker);
    const replaceProperty = this._moduleMocker.replaceProperty.bind(
      this._moduleMocker,
    );

    const setTimeout: Jest['setTimeout'] = timeout => {
      this._environment.global[testTimeoutSymbol] = timeout;
      return jestObject;
    };

    const retryTimes: Jest['retryTimes'] = (numTestRetries, options) => {
      this._environment.global[retryTimesSymbol] = numTestRetries;
      this._environment.global[logErrorsBeforeRetrySymbol] =
        options?.logErrorsBeforeRetry;
      this._environment.global[waitBeforeRetrySymbol] =
        options?.waitBeforeRetry;
      this._environment.global[retryImmediatelySybmbol] =
        options?.retryImmediately;

      return jestObject;
    };

    const jestObject: Jest = {
      advanceTimersByTime: msToRun =>
        _getFakeTimers().advanceTimersByTime(msToRun),
      advanceTimersByTimeAsync: async msToRun => {
        const fakeTimers = _getFakeTimers();

        if (fakeTimers === this._environment.fakeTimersModern) {
          await fakeTimers.advanceTimersByTimeAsync(msToRun);
        } else {
          throw new TypeError(
            '`jest.advanceTimersByTimeAsync()` is not available when using legacy fake timers.',
          );
        }
      },
      advanceTimersToNextFrame: () => {
        const fakeTimers = _getFakeTimers();

        if (fakeTimers === this._environment.fakeTimersModern) {
          return fakeTimers.advanceTimersToNextFrame();
        }
        throw new TypeError(
          '`jest.advanceTimersToNextFrame()` is not available when using legacy fake timers.',
        );
      },
      advanceTimersToNextTimer: steps =>
        _getFakeTimers().advanceTimersToNextTimer(steps),
      advanceTimersToNextTimerAsync: async steps => {
        const fakeTimers = _getFakeTimers();

        if (fakeTimers === this._environment.fakeTimersModern) {
          await fakeTimers.advanceTimersToNextTimerAsync(steps);
        } else {
          throw new TypeError(
            '`jest.advanceTimersToNextTimerAsync()` is not available when using legacy fake timers.',
          );
        }
      },
      autoMockOff: disableAutomock,
      autoMockOn: enableAutomock,
      clearAllMocks,
      clearAllTimers: () => _getFakeTimers().clearAllTimers(),
      createMockFromModule: moduleName => this._generateMock(from, moduleName),
      deepUnmock,
      disableAutomock,
      doMock: mock,
      dontMock: unmock,
      enableAutomock,
      fn,
      getRealSystemTime: () => {
        const fakeTimers = _getFakeTimers();

        if (fakeTimers === this._environment.fakeTimersModern) {
          return fakeTimers.getRealSystemTime();
        } else {
          throw new TypeError(
            '`jest.getRealSystemTime()` is not available when using legacy fake timers.',
          );
        }
      },
      getSeed: () => this._globalConfig.seed,
      getTimerCount: () => _getFakeTimers().getTimerCount(),
      isEnvironmentTornDown: () => this.testState === 'tornDown',
      isMockFunction: this._moduleMocker.isMockFunction,
      isolateModules,
      isolateModulesAsync,
      mock,
      mocked,
      now: () => _getFakeTimers().now(),
      onGenerateMock,
      replaceProperty,
      requireActual: moduleName => this.requireActual(from, moduleName),
      requireMock: moduleName => this.requireMock(from, moduleName),
      resetAllMocks,
      resetModules,
      restoreAllMocks,
      retryTimes,
      runAllImmediates: () => {
        const fakeTimers = _getFakeTimers();

        if (fakeTimers === this._environment.fakeTimers) {
          fakeTimers.runAllImmediates();
        } else {
          throw new TypeError(
            '`jest.runAllImmediates()` is only available when using legacy fake timers.',
          );
        }
      },
      runAllTicks: () => _getFakeTimers().runAllTicks(),
      runAllTimers: () => _getFakeTimers().runAllTimers(),
      runAllTimersAsync: async () => {
        const fakeTimers = _getFakeTimers();

        if (fakeTimers === this._environment.fakeTimersModern) {
          await fakeTimers.runAllTimersAsync();
        } else {
          throw new TypeError(
            '`jest.runAllTimersAsync()` is not available when using legacy fake timers.',
          );
        }
      },
      runOnlyPendingTimers: () => _getFakeTimers().runOnlyPendingTimers(),
      runOnlyPendingTimersAsync: async () => {
        const fakeTimers = _getFakeTimers();

        if (fakeTimers === this._environment.fakeTimersModern) {
          await fakeTimers.runOnlyPendingTimersAsync();
        } else {
          throw new TypeError(
            '`jest.runOnlyPendingTimersAsync()` is not available when using legacy fake timers.',
          );
        }
      },
      setMock: (moduleName, mock) => setMockFactory(moduleName, () => mock),
      setSystemTime: now => {
        const fakeTimers = _getFakeTimers();

        if (fakeTimers === this._environment.fakeTimersModern) {
          fakeTimers.setSystemTime(now);
        } else {
          throw new TypeError(
            '`jest.setSystemTime()` is not available when using legacy fake timers.',
          );
        }
      },
      setTimeout,
      setTimerTickMode: (
        mode:
          | {mode: 'manual' | 'nextAsync'}
          | {mode: 'interval'; delta?: number},
      ) => {
        const fakeTimers = _getFakeTimers();
        if (fakeTimers === this._environment.fakeTimersModern) {
          fakeTimers.setTimerTickMode(mode);
        } else {
          throw new TypeError(
            '`jest.setTimerTickMode()` is not available when using legacy fake timers.',
          );
        }
        return jestObject;
      },
      spyOn,
      unmock,
      unstable_mockModule: mockModule,
      unstable_unmockModule: unmockModule,
      useFakeTimers,
      useRealTimers,
    };
    return jestObject;
  }

  private _logFormattedReferenceError(errorMessage: string) {
    const testPath = this._testPath
      ? ` From ${slash(path.relative(this._config.rootDir, this._testPath))}.`
      : '';
    const originalStack = new ReferenceError(`${errorMessage}${testPath}`)
      .stack!.split('\n')
      // Remove this file from the stack (jest-message-utils will keep one line)
      .filter(line => !line.includes(__filename))
      .join('\n');

    const {message, stack} = separateMessageFromStack(originalStack);

    const stackTrace = formatStackTrace(stack, this._config, {
      noStackTrace: false,
    });
    const formattedMessage = `\n${message}${
      stackTrace ? `\n${stackTrace}` : ''
    }`;
    if (!this.loggedReferenceErrors.has(formattedMessage)) {
      console.error(formattedMessage);
      this.loggedReferenceErrors.add(formattedMessage);
    }
  }

  private getGlobalsForCjs(from: string): JestGlobalsWithJest {
    const jest = this.jestObjectCaches.get(from);

    invariant(jest, 'There should always be a Jest object already');

    return {...this.getGlobalsFromEnvironment(), jest};
  }

  private _getOrCreateJest(from: string): Jest {
    let jest = this.jestObjectCaches.get(from);

    if (!jest) {
      jest = this._createJestObjectFor(from);

      this.jestObjectCaches.set(from, jest);
    }
    return jest;
  }

  private getGlobalsFromEnvironment(): JestGlobals {
    if (this.jestGlobals) {
      return {...this.jestGlobals};
    }

    return {
      afterAll: this._environment.global.afterAll,
      afterEach: this._environment.global.afterEach,
      beforeAll: this._environment.global.beforeAll,
      beforeEach: this._environment.global.beforeEach,
      describe: this._environment.global.describe,
      expect: this._environment.global.expect as typeof expect,
      fdescribe: this._environment.global.fdescribe,
      fit: this._environment.global.fit,
      it: this._environment.global.it,
      test: this._environment.global.test,
      xdescribe: this._environment.global.xdescribe,
      xit: this._environment.global.xit,
      xtest: this._environment.global.xtest,
    };
  }

  setGlobalsForRuntime(globals: JestGlobals): void {
    this.jestGlobals = globals;
  }
}
