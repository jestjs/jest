/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import nativeModule from 'node:module';
import * as path from 'node:path';
import {SourceTextModule} from 'node:vm';
import slash from 'slash';
import type {JestEnvironment} from '@jest/environment';
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
import {JestGlobals} from './internals/JestGlobals';
import {MockState, generateMock} from './internals/MockState';
import {ModuleExecutor} from './internals/ModuleExecutor';
import {ModuleRegistries} from './internals/ModuleRegistries';
import {Resolution} from './internals/Resolution';
import {TestMainModule} from './internals/TestMainModule';
import {TestState} from './internals/TestState';
import {
  TransformCache,
  type TransformOptions,
} from './internals/TransformCache';
import {V8CoverageCollector} from './internals/V8CoverageCollector';
import {CoreModuleProvider, RequireBuilder} from './internals/cjsRequire';
import type {InitialModule, ModuleRegistry} from './internals/moduleTypes';
import {runtimeSupportsVmModules} from './internals/nodeCapabilities';
import type {EnvironmentGlobals} from './internals/types';

// Modules safe to require from the outside (not stateful, not prone to
// realm errors) and slow enough that paying the worker-cache hit is worth
// it. Internal context only - user `require()` from a test still goes
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
  private readonly _coverageOptions: ShouldInstrumentOptions;
  private readonly _environment: JestEnvironment;
  private readonly mockState: MockState;
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
  private readonly jestGlobals: JestGlobals;
  private readonly testState: TestState;
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
    this.registries = new ModuleRegistries();
    invariant(
      this._environment.moduleMocker,
      '`moduleMocker` must be set on an environment when created',
    );
    this._moduleMocker = this._environment.moduleMocker;
    this._testPath = testPath;
    this.testState = new TestState(msg =>
      this._logFormattedReferenceError(msg),
    );
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
    this._resolution = new Resolution(
      resolver,
      this._environment.exportConditions?.() ?? [],
      config.extensionsToTreatAsEsm,
    );
    this.mockState = new MockState(this._resolution, config);
    this.cjsExportsCache = new CjsExportsCache({
      fileCache: this.fileCache,
      loadCoreReexport: (from, coreName) => this.requireModule(from, coreName),
      loadNativeAddon: (from, modulePath) =>
        this.requireModuleOrMock(from, modulePath),
      resolution: this._resolution,
      transformCache: this.transformCache,
    });
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
    this.jestGlobals = new JestGlobals({
      clearAllMocks: () => this.clearAllMocks(),
      config,
      environment: this._environment,
      generateMock: (from, moduleName) => this._generateMock(from, moduleName),
      globalConfig,
      isolateModules: fn => this.isolateModules(fn),
      isolateModulesAsync: fn => this.isolateModulesAsync(fn),
      logFormattedReferenceError: msg => this._logFormattedReferenceError(msg),
      mockState: this.mockState,
      moduleMocker: this._moduleMocker,
      requireActual: (from, moduleName) => this.requireActual(from, moduleName),
      requireMock: (from, moduleName) => this.requireMock(from, moduleName),
      resetAllMocks: () => this.resetAllMocks(),
      resetModules: () => this.resetModules(),
      restoreAllMocks: () => this.restoreAllMocks(),
      setMock: (from, moduleName, mockFactory, options) =>
        this.setMock(from, moduleName, mockFactory, options),
      setModuleMock: (from, moduleName, mockFactory, options) =>
        this.setModuleMock(from, moduleName, mockFactory, options),
      testState: this.testState,
    });
    this.esmLoader = new EsmLoader({
      cjsExportsCache: this.cjsExportsCache,
      coreModule: this.coreModule,
      environment: this._environment,
      fileCache: this.fileCache,
      jestGlobals: this.jestGlobals,
      mockState: this.mockState,
      registries: this.registries,
      requireModuleOrMock: (from, moduleName) =>
        this.requireModuleOrMock(from, moduleName),
      resolution: this._resolution,
      shouldLoadAsEsm: modulePath => this.unstable_shouldLoadAsEsm(modulePath),
      testState: this.testState,
      transformCache: this.transformCache,
    });
    this.executor = new ModuleExecutor({
      config,
      dynamicImport: (specifier, identifier, context, importAttributes) =>
        this.esmLoader.dynamicImportFromCjs(
          specifier,
          identifier,
          context,
          importAttributes,
        ),
      environment: this._environment,
      jestGlobals: this.jestGlobals,
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
      logFormattedReferenceError: msg => this._logFormattedReferenceError(msg),
      mockState: this.mockState,
      registries: this.registries,
      requireEsm: <T>(modulePath: string) =>
        this.esmLoader.requireEsmModule<T>(modulePath),
      resolution: this._resolution,
      testState: this.testState,
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
    return this._requireMockWithId<T>(
      from,
      moduleName,
      this.mockState.getCjsModuleId(from, moduleName),
    );
  }

  private _requireMockWithId<T>(
    from: string,
    moduleName: string,
    moduleID: string,
  ): T {
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

    const manualMockPath = this._resolution.findManualMock(from, moduleName);

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
    if (
      this.testState.bailIfTornDown(
        'You are trying to `require` a file after the Jest environment has been torn down.',
      )
    ) {
      // @ts-expect-error: exiting early
      return;
    }

    // this module is unmockable
    if (moduleName === '@jest/globals') {
      // @ts-expect-error: we don't care that it's not assignable to T
      return this.jestGlobals.cjsGlobals(from);
    }

    try {
      const {shouldMock, moduleID} = this.mockState.shouldMockCjs(
        from,
        moduleName,
      );
      if (shouldMock) {
        return this._requireMockWithId<T>(from, moduleName, moduleID);
      }
      return this.requireModule<T>(from, moduleName);
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
        this._moduleMocker.clearMocksOnScope(this._environment.global);
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
    this.testState.enterTestCode();
  }

  leaveTestCode(): void {
    this.testState.leaveTestCode();
  }

  teardown(): void {
    this.restoreAllMocks();
    this.resetModules();

    this.registries.clear();
    this.testMainModule.reset();
    this.mockState.clear();
    this.fileCache.clear();

    this.transformCache.clear();
    this.jestGlobals.clearJestObjectCache();

    this.v8Coverage.reset();
    this.coreModule.reset();
    this.loggedReferenceErrors.clear();

    this.testState.teardown();
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

  setGlobalsForRuntime(globals: EnvironmentGlobals): void {
    this.jestGlobals.setEnvGlobalsOverride(globals);
  }
}
