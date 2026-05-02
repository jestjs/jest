/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import nativeModule from 'node:module';
import * as path from 'node:path';
import {type URL, fileURLToPath, pathToFileURL} from 'node:url';
import {
  SourceTextModule,
  SyntheticModule,
  type Context as VMContext,
  type Module as VMModule,
} from 'node:vm';
import * as fs from 'graceful-fs';
import slash from 'slash';
import type {Jest, JestEnvironment, JestImportMeta} from '@jest/environment';
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
import {createDirectory, deepCyclicCopy, invariant, isError} from 'jest-util';
import {
  decodePossibleOutsideJestVmPath,
  findSiblingsWithFileExtension,
  noop,
} from './helpers';
import {CjsExportsCache} from './internals/CjsExportsCache';
import {CjsLoader} from './internals/CjsLoader';
import {FileCache} from './internals/FileCache';
import {MockState} from './internals/MockState';
import {ModuleExecutor, isCjsParseError} from './internals/ModuleExecutor';
import {ModuleRegistries} from './internals/ModuleRegistries';
import {Resolution, isWasm} from './internals/Resolution';
import {TestMainModule} from './internals/TestMainModule';
import {
  TransformCache,
  type TransformOptions,
} from './internals/TransformCache';
import {V8CoverageCollector} from './internals/V8CoverageCollector';
import {generateMock} from './internals/automock';
import {CoreModuleProvider, RequireBuilder} from './internals/cjsRequire';
import type {
  ESModule,
  InitialModule,
  JestModule,
  ModuleRegistry,
} from './internals/moduleTypes';
import {
  runtimeSupportsVmModules,
  supportsSyncEvaluate,
} from './internals/nodeCapabilities';
import {
  buildCjsAsEsmSyntheticModule,
  buildCoreSyntheticModule,
  buildJestGlobalsSyntheticModule,
  buildJsonSyntheticModule,
  buildWasmSyntheticModule,
  evaluateSyntheticModule,
} from './internals/syntheticBuilders';
import type {JestGlobals, JestGlobalsWithJest} from './internals/types';

// Modules safe to require from the outside (not stateful, not prone to
// realm errors) and slow enough that paying the worker-cache hit is worth
// it. Internal context only — user `require()` from a test still goes
// through the VM.
const INTERNAL_MODULE_REQUIRE_OUTSIDE_OPTIMIZED_MODULES = new Set(['chalk']);

const esmIsAvailable = typeof SourceTextModule === 'function';
const supportsDynamicImport = esmIsAvailable;

const dataURIRegex =
  /^data:(?<mime>text\/javascript|application\/json|application\/wasm)(?:;(?<encoding>charset=utf-8|base64))?,(?<code>.*)$/;

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

// `linkRequests`/`instantiate`/`hasAsyncGraph`/`hasTopLevelAwait`/
// `moduleRequests` ship in Node v24.9 and aren't yet in `@types/node@18`.
// This local interface lets us narrow without `@ts-expect-error` at every
// call site. Drop the optional `?:` modifiers (or remove the interface
// entirely) when `@types/node` catches up.
interface VMModuleWithAsyncGraph extends VMModule {
  hasAsyncGraph?: () => boolean;
  hasTopLevelAwait?: () => boolean;
  moduleRequests?: ReadonlyArray<{
    specifier: string;
    attributes: Record<string, string>;
    phase?: string;
  }>;
  linkRequests?: (deps: ReadonlyArray<VMModule>) => void;
  instantiate?: () => void;
}

// Future `require(esm)` needs a way to signal "throw a typed error instead of
// bailing to the legacy async path" on the same edges we currently silently
// bail on. Plumbed through every helper so that change only adds the throw
// branches; the dispatch wrapper in this currently always passes
// `'sync-preferred'`.
type SyncEsmMode = 'sync-preferred' | 'sync-required';

type WorklistEntry = {
  cacheKey: string;
  modulePath: string;
};

// `SourceTextModule#hasAsyncGraph()` lets us prove a graph is sync-evaluable.
// `SyntheticModule` does not expose it but is by definition sync (the user
// callback is sync), so treat its absence as "not async".
function moduleHasAsyncGraph(module: VMModuleWithAsyncGraph): boolean {
  return typeof module.hasAsyncGraph === 'function'
    ? module.hasAsyncGraph()
    : false;
}

// Mirrors Node's `require(esm)` error code so user catches work uniformly.
function makeRequireAsyncError(
  modulePath: string,
  detail: string,
): NodeJS.ErrnoException {
  const error: NodeJS.ErrnoException = new Error(
    `require() cannot be used to load ES Module ${modulePath}: ${detail}`,
  );
  error.code = 'ERR_REQUIRE_ASYNC_MODULE';
  return error;
}

// Decode a `data:` URI specifier into its mime type and decoded code/body.
// `application/wasm` returns a Buffer; everything else returns a UTF-8 string.
function parseDataUri(specifier: string): {
  mime: string;
  code: string | Buffer;
} {
  const match = specifier.match(dataURIRegex);
  if (!match || !match.groups) {
    throw new Error('Invalid data URI');
  }
  const {mime, encoding, code} = match.groups;
  if (mime === 'application/wasm') {
    if (!encoding) throw new Error('Missing data URI encoding');
    if (encoding !== 'base64') {
      throw new Error(`Invalid data URI encoding: ${encoding}`);
    }
    return {code: Buffer.from(code, 'base64'), mime};
  }
  if (!encoding || encoding === 'charset=utf-8') {
    return {code: decodeURIComponent(code), mime};
  }
  if (encoding === 'base64') {
    return {code: Buffer.from(code, 'base64').toString(), mime};
  }
  throw new Error(`Invalid data URI encoding: ${encoding}`);
}

const ESM_TRANSFORM_OPTIONS: TransformOptions = {
  isInternalModule: false,
  supportsDynamicImport: true,
  supportsExportNamespaceFrom: true,
  supportsStaticESM: true,
  supportsTopLevelAwait: true,
};

// Source-text entries carry their dep cacheKeys (used for `linkRequests`).
// Synthetic entries (mocks, core, JSON, wasm, @jest/globals) start linked
// and never appear in the link-requests pass.
type ScratchEntry =
  | {
      kind: 'source';
      cacheKey: string;
      module: VMModuleWithAsyncGraph;
      deps: Array<string>;
    }
  | {kind: 'synthetic'; cacheKey: string; module: VMModuleWithAsyncGraph};

function stripFileScheme(specifier: string): string {
  return specifier.startsWith('file://') ? fileURLToPath(specifier) : specifier;
}

function buildMockSyntheticModule(
  identifier: string,
  context: VMContext,
  exportsObject: Record<string, unknown>,
): SyntheticModule {
  return new SyntheticModule(
    Object.keys(exportsObject),
    function () {
      for (const [key, value] of Object.entries(exportsObject)) {
        this.setExport(key, value);
      }
    },
    {context, identifier},
  );
}

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
  private readonly cjsLoader: CjsLoader;
  private readonly _moduleMocker: ModuleMocker;
  private readonly cjsExportsCache: CjsExportsCache;
  private readonly _esmModuleLinkingMap: WeakMap<JestModule, Promise<unknown>>;
  private readonly _esmModuleEvaluatingMap: WeakMap<JestModule, Promise<void>>;
  private readonly _testPath: string;
  private readonly _resolution: Resolution;
  private readonly _scriptTransformer: ScriptTransformer;
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
    this._esmModuleLinkingMap = new WeakMap();
    this._esmModuleEvaluatingMap = new WeakMap();
    this._testPath = testPath;
    this._scriptTransformer = transformer;
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
    this.executor = new ModuleExecutor({
      config,
      dynamicImport: (specifier, identifier, context) =>
        this.resolveModule<VMModule>(specifier, identifier, context).then(m =>
          this.linkAndEvaluateModule(m),
        ),
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
        this._requireEsmModule<T>(modulePath),
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

  // Synchronous graph loader for Node v24.9+. Walks the static import graph
  // depth-first, constructs every node, links via `linkRequests`, instantiates
  // the root, and evaluates synchronously. Returns the fully-evaluated root.
  // The dispatch wrapper additionally guards on `_resolution.canResolveSync()`,
  // so this method assumes synchronous resolution is available.
  // Returns `null` when the graph cannot be completed synchronously (async
  // transformer, TLA, async mock factory) and the caller must fall back to
  // the legacy async path. Note that some modules - core modules, the
  // `@jest/globals` synthetic, CJS-as-ESM wrappers, mocked specifiers - are
  // committed to the registry as we walk, so a later bail can leave those
  // partial entries in the cache; subsequent loads pick them up unchanged.
  // The graph's `SourceTextModule`s, by contrast, are kept in `scratch` and
  // committed only after `instantiate()` succeeds, so a bail mid-walk doesn't
  // leak unlinked source-text modules.
  private _tryLoadEsmGraphSync(
    rootPath: string,
    rootQuery: string,
    mode: SyncEsmMode,
  ): ESModule | null {
    if (this.testState === 'tornDown') {
      this._logFormattedReferenceError(
        'You are trying to `import` a file after the Jest environment has been torn down.',
      );
      process.exitCode = 1;
      return null;
    }
    if (this.testState === 'betweenTests' && !supportsDynamicImport) {
      throw new ReferenceError(
        'You are trying to `import` a file outside of the scope of the test code.',
      );
    }

    const registry = this.registries.getActiveEsmRegistry();
    const rootKey = rootPath + rootQuery;

    // Fast path: if the root is already loaded we skip context lookup and
    // graph walking entirely. Legacy may have stashed a Promise here from a
    // mid-flight async load - defer to it.
    const cached = registry.get(rootKey);
    if (cached && !(cached instanceof Promise)) {
      return cached as ESModule;
    }
    if (cached instanceof Promise) {
      return null;
    }

    invariant(
      typeof this._environment.getVmContext === 'function',
      'ES Modules are only supported if your test environment has the `getVmContext` function',
    );
    const context = this._environment.getVmContext();
    invariant(context, 'Test environment has been torn down');

    // The legacy async path may be mid-flight on this module from a previous
    // top-level call - for example, `module.link(asyncLinker)` fans out to
    // deps, the linker calls back into `loadEsmModule`, and that call routes
    // here while legacy still holds the mutex on the parent's
    // `transformFileAsync`. Defer to legacy in that case so we await its
    // in-flight transform rather than starting a parallel one.
    if (this.transformCache.hasMutex(rootKey)) return null;

    const scratch = new Map<string, ScratchEntry>();
    const worklist: Array<WorklistEntry> = [
      {cacheKey: rootKey, modulePath: rootPath},
    ];

    while (worklist.length > 0) {
      const {cacheKey, modulePath} = worklist.pop()!;
      if (scratch.has(cacheKey)) continue;

      // Same rationale as the root-level mutex check above: a different
      // top-level legacy load may already be transforming this dep.
      if (this.transformCache.hasMutex(cacheKey)) return null;

      const fromRegistry = registry.get(cacheKey);
      if (fromRegistry && !(fromRegistry instanceof Promise)) {
        scratch.set(cacheKey, {
          cacheKey,
          kind: 'synthetic',
          module: fromRegistry as VMModuleWithAsyncGraph,
        });
        continue;
      }
      if (fromRegistry instanceof Promise) return null;

      if (this._resolution.isCoreModule(modulePath)) {
        scratch.set(cacheKey, {
          cacheKey,
          kind: 'synthetic',
          module: this._buildCoreSyntheticModule(modulePath, context),
        });
        continue;
      }

      if (modulePath.startsWith('data:')) {
        const built = this._buildSyncDataUriEntry(
          modulePath,
          cacheKey,
          context,
          scratch,
          registry,
          worklist,
          mode,
        );
        if (built === null) return null;
        scratch.set(cacheKey, built);
        continue;
      }

      if (isWasm(modulePath)) {
        const wasmEntry = this._buildSyncWasmEntry(
          this.fileCache.readFileBuffer(modulePath),
          modulePath,
          cacheKey,
          context,
          scratch,
          registry,
          worklist,
          mode,
        );
        if (wasmEntry === null) return null;
        scratch.set(cacheKey, wasmEntry);
        continue;
      }

      if (!this._scriptTransformer.canTransformSync(modulePath)) {
        if (mode === 'sync-required') {
          throw makeRequireAsyncError(
            modulePath,
            'a configured transformer is async-only',
          );
        }
        // Async transformer required for this file - bail.
        return null;
      }

      if (modulePath.endsWith('.json')) {
        scratch.set(cacheKey, {
          cacheKey,
          kind: 'synthetic',
          module: buildJsonSyntheticModule(
            this.transformCache.transform(modulePath, ESM_TRANSFORM_OPTIONS),
            modulePath,
            context,
          ),
        });
        continue;
      }

      const transformedCode = this.transformCache.transform(
        modulePath,
        ESM_TRANSFORM_OPTIONS,
      );

      const module: VMModuleWithAsyncGraph = new SourceTextModule(
        transformedCode,
        {
          context,
          identifier: modulePath,
          importModuleDynamically: this._esmDynamicImport,
          initializeImportMeta: meta => {
            const metaUrl = pathToFileURL(modulePath).href;
            meta.url = metaUrl;
            // @ts-expect-error Jest uses @types/node@18.
            meta.filename = modulePath;
            // @ts-expect-error Jest uses @types/node@18.
            meta.dirname = path.dirname(modulePath);
            meta.resolve = (specifier, parent: string | URL = metaUrl) => {
              const parentPath = fileURLToPath(parent);
              return pathToFileURL(
                this._resolution.resolveEsm(parentPath, specifier),
              ).href;
            };
            let jest = this.jestObjectCaches.get(modulePath);
            if (!jest) {
              jest = this._createJestObjectFor(modulePath);
              this.jestObjectCaches.set(modulePath, jest);
            }
            (meta as JestImportMeta).jest = jest;
          },
        },
      );

      // Top-level await is detectable per-module before we walk further.
      // Bailing now skips construction of every node still on the worklist
      // (a transitive TLA elsewhere in the graph would be caught later by
      // the post-instantiate `hasAsyncGraph()` check; this one cuts off the
      // common "TLA at the entry file" case before doing any more work).
      if (
        typeof module.hasTopLevelAwait === 'function' &&
        module.hasTopLevelAwait()
      ) {
        if (mode === 'sync-required') {
          throw makeRequireAsyncError(modulePath, 'top-level await');
        }
        return null;
      }

      // Walk dependencies via the v24.9+ `moduleRequests` accessor.
      const requests = module.moduleRequests;
      if (requests === undefined) return null;
      const deps: Array<string> = [];
      for (const {specifier} of requests) {
        const resolved = this._resolveSpecifierForSyncGraph(
          modulePath,
          specifier,
          context,
          scratch,
          registry,
          mode,
        );
        if (resolved === null) return null;
        deps.push(resolved.cacheKey);
        if (resolved.enqueue) worklist.push(resolved.enqueue);
      }

      scratch.set(cacheKey, {cacheKey, deps, kind: 'source', module});
    }

    // Link every source-text module to its deps. SyntheticModule entries
    // start linked and have no `linkRequests` of their own; they plug into
    // the parent's `linkRequests` array directly.
    for (const entry of scratch.values()) {
      if (entry.kind !== 'source') continue;
      const depModules = entry.deps.map(depKey => {
        const depEntry = scratch.get(depKey);
        invariant(
          depEntry,
          `Sync ESM graph missing dep ${depKey} for ${entry.cacheKey}. This is a bug in Jest, please report it!`,
        );
        return depEntry.module as VMModule;
      });
      invariant(
        typeof entry.module.linkRequests === 'function',
        `linkRequests unavailable on ${entry.cacheKey}`,
      );
      entry.module.linkRequests(depModules);
    }

    const rootEntry = scratch.get(rootKey);
    invariant(rootEntry, 'Sync ESM graph missing root entry');
    const rootModule = rootEntry.module;

    if (rootEntry.kind === 'source') {
      invariant(
        typeof rootModule.instantiate === 'function',
        'instantiate unavailable on root',
      );
      rootModule.instantiate();

      if (moduleHasAsyncGraph(rootModule)) {
        if (mode === 'sync-required') {
          let culprit = rootModule.identifier;
          for (const entry of scratch.values()) {
            if (
              entry.kind === 'source' &&
              typeof entry.module.hasTopLevelAwait === 'function' &&
              entry.module.hasTopLevelAwait()
            ) {
              culprit = entry.module.identifier;
              break;
            }
          }
          throw makeRequireAsyncError(
            rootModule.identifier,
            culprit === rootModule.identifier
              ? 'top-level await'
              : `a dependency uses top-level await (${culprit})`,
          );
        }
        // TLA somewhere in the graph - bail to legacy async path.
        return null;
      }
    }

    // Commit scratch to the registry before evaluation, so importMeta
    // closures and dynamic imports observe a consistent cache.
    for (const entry of scratch.values()) {
      if (!registry.has(entry.cacheKey)) {
        registry.set(entry.cacheKey, entry.module);
      }
    }

    // SyntheticModule.evaluate() is sync; SourceTextModule.evaluate() is
    // sync when hasAsyncGraph() is false (checked above). The returned
    // Promise mirrors that sync state; attach a noop .catch so eval errors
    // don't surface as unhandled rejections after we throw module.error.
    rootModule.evaluate().catch(noop);
    const status = rootModule.status as VMModule['status'];
    if (status === 'errored') {
      throw rootModule.error;
    }
    invariant(
      status === 'evaluated',
      `Expected synchronous evaluation to complete for ${rootModule.identifier}, but module status is "${status}". This is a bug in Jest, please report it!`,
    );

    return rootModule;
  }

  // A `null` here means the legacy async path is mid-flight on this same
  // module (registry holds a Promise from a concurrent `await import()`);
  // surface as ERR_REQUIRE_ESM with actionable context.
  //
  // Root-level mocks (`jest.unstable_mockModule(spec)` then `require(spec)`)
  // are not consulted - driving a SyntheticModule from `unlinked` to
  // `evaluated` needs the async link()/evaluate() pair. Transitive-dep mocks
  // still apply via the graph walker.
  private _requireEsmModule<T>(modulePath: string): T {
    const module = this._tryLoadEsmGraphSync(modulePath, '', 'sync-required');
    if (!module) {
      const error: NodeJS.ErrnoException = new Error(
        `Cannot require() ES Module ${modulePath} synchronously: it is currently being loaded by a concurrent \`import()\`. Await that import before calling require(), or import this module instead of requiring it.`,
      );
      error.code = 'ERR_REQUIRE_ESM';
      throw error;
    }
    return (module as VMModule).namespace as T;
  }

  // Resolve one static-import specifier for the sync graph walker. Returns
  // null on any async-edge or unsupported case so the caller can bail.
  //
  // Side effects: for `@jest/globals`, mocked specifiers, and CJS-as-ESM
  // wrappers this commits the constructed SyntheticModule to both the local
  // `scratch` and the long-lived `registry`/`_moduleMockRegistry` before
  // returning. Source-text and JSON deps are only enqueued (the parent
  // worklist commits them on success). A subsequent bail does not unwind
  // these eager commits - see `_tryLoadEsmGraphSync`'s header for the
  // implications.
  // Commit (or reuse) a synthetic-module entry under `cacheKey` in both the
  // long-lived registry and the local scratch map. Returns false when the
  // registry entry is a mid-flight Promise (caller bails); true on success.
  private _commitSyntheticToScratch(
    cacheKey: string,
    registry: ModuleRegistry | Map<string, JestModule>,
    scratch: Map<string, ScratchEntry>,
    build: () => VMModuleWithAsyncGraph,
  ): boolean {
    if (scratch.has(cacheKey)) return true;
    const fromRegistry = registry.get(cacheKey);
    if (fromRegistry instanceof Promise) return false;
    const module =
      (fromRegistry as VMModuleWithAsyncGraph | undefined) ?? build();
    if (!fromRegistry) registry.set(cacheKey, module);
    scratch.set(cacheKey, {cacheKey, kind: 'synthetic', module});
    return true;
  }

  private _resolveSpecifierForSyncGraph(
    referencingIdentifier: string,
    specifier: string,
    context: VMContext,
    scratch: Map<string, ScratchEntry>,
    registry: ModuleRegistry | Map<string, JestModule>,
    mode: SyncEsmMode,
  ): {cacheKey: string; enqueue: WorklistEntry | null} | null {
    if (specifier === '@jest/globals') {
      const cacheKey = `@jest/globals/${referencingIdentifier}`;
      const ok = this._commitSyntheticToScratch(
        cacheKey,
        registry,
        scratch,
        () =>
          this._buildJestGlobalsSyntheticModule(referencingIdentifier, context),
      );
      return ok ? {cacheKey, enqueue: null} : null;
    }

    // data: URIs flow through the worklist; the worklist handles their
    // construction (including their own static graph for text/javascript).
    if (specifier.startsWith('data:')) {
      const cacheKey = specifier;
      return {
        cacheKey,
        enqueue: {cacheKey, modulePath: specifier},
      };
    }
    specifier = stripFileScheme(specifier);

    const [specifierPath, query = ''] = specifier.split('?');

    if (
      this.mockState.shouldMockEsmSync(referencingIdentifier, specifierPath)
    ) {
      const mocked = this._importMockSync(
        referencingIdentifier,
        specifierPath,
        context,
        scratch,
        mode,
      );
      if (mocked === null) return null;
      return {cacheKey: mocked.cacheKey, enqueue: null};
    }

    if (this._resolution.isCoreModule(specifierPath)) {
      const cacheKey = specifierPath + query;
      return {
        cacheKey,
        enqueue: {cacheKey, modulePath: specifierPath},
      };
    }

    let resolved: string;
    try {
      resolved = this._resolution.resolveEsm(
        referencingIdentifier,
        specifierPath,
      );
    } catch {
      return null;
    }

    const cacheKey = resolved + query;
    if (
      !resolved.endsWith('.json') &&
      !isWasm(resolved) &&
      !this.unstable_shouldLoadAsEsm(resolved)
    ) {
      // CJS-as-ESM: SyntheticModule starts linked, plugs straight into
      // the parent's `linkRequests([syn])`.
      const ok = this._commitSyntheticToScratch(
        cacheKey,
        registry,
        scratch,
        () =>
          this._buildCjsAsEsmSyntheticModule(
            referencingIdentifier,
            resolved,
            context,
          ),
      );
      return ok ? {cacheKey, enqueue: null} : null;
    }

    return {
      cacheKey,
      enqueue: {cacheKey, modulePath: resolved},
    };
  }

  // Sync mirror of `importMock`. Returns null when the mock factory is async
  // (Promise-returning) or absent - the caller bails to the legacy path.
  private _importMockSync(
    from: string,
    moduleName: string,
    context: VMContext,
    scratch: Map<string, ScratchEntry>,
    mode: SyncEsmMode,
  ): {cacheKey: string} | null {
    const moduleID = this.mockState.getEsmModuleId(from, moduleName);

    const existing = this.registries.getModuleMock(moduleID);
    if (existing instanceof Promise) return null;
    if (existing) {
      if (!scratch.has(moduleID)) {
        scratch.set(moduleID, {
          cacheKey: moduleID,
          kind: 'synthetic',
          module: existing,
        });
      }
      return {cacheKey: moduleID};
    }

    const factory = this.mockState.getEsmFactory(moduleID);
    if (factory === undefined) return null;

    const result = factory();
    if (
      result !== null &&
      typeof result === 'object' &&
      typeof (result as {then?: unknown}).then === 'function'
    ) {
      if (mode === 'sync-required') {
        throw makeRequireAsyncError(moduleName, 'mock factory is async');
      }
      // Async factory - sync path can't await; fall back to legacy.
      return null;
    }

    const synth = buildMockSyntheticModule(
      moduleName,
      context,
      result as Record<string, unknown>,
    );
    this.registries.setModuleMock(moduleID, synth);
    scratch.set(moduleID, {
      cacheKey: moduleID,
      kind: 'synthetic',
      module: synth,
    });
    return {cacheKey: moduleID};
  }

  // Construct a wasm SyntheticModule for the sync graph. Wasm imports are
  // resolved (sync) and enqueued like static-import deps. The SyntheticModule's
  // body closure-captures `scratch`; by evaluate-cascade time, every dep entry
  // is fully evaluated so `module.namespace` is safe to read.
  //
  // Uses `new WebAssembly.Module(bytes)` (sync, blocks on large modules). When
  // the legacy async path is removed and this core grows async-shell handling,
  // graphs that have already committed to async should switch to
  // `await WebAssembly.compile(bytes)` to avoid blocking the event loop.
  private _buildSyncWasmEntry(
    bytes: BufferSource,
    identifier: string,
    cacheKey: string,
    context: VMContext,
    scratch: Map<string, ScratchEntry>,
    registry: ModuleRegistry | Map<string, JestModule>,
    worklist: Array<WorklistEntry>,
    mode: SyncEsmMode,
  ): ScratchEntry | null {
    const wasmModule = new WebAssembly.Module(bytes);

    const moduleSpecToCacheKey = new Map<string, string>();
    for (const {module: depSpec} of WebAssembly.Module.imports(wasmModule)) {
      if (moduleSpecToCacheKey.has(depSpec)) continue;
      const resolved = this._resolveSpecifierForSyncGraph(
        identifier,
        depSpec,
        context,
        scratch,
        registry,
        mode,
      );
      if (resolved === null) return null;
      moduleSpecToCacheKey.set(depSpec, resolved.cacheKey);
      if (resolved.enqueue) worklist.push(resolved.enqueue);
    }

    const synthetic = buildWasmSyntheticModule(
      wasmModule,
      identifier,
      context,
      depSpec => {
        const depKey = moduleSpecToCacheKey.get(depSpec)!;
        const depEntry = scratch.get(depKey)!;
        return (depEntry.module as VMModule).namespace as Record<
          string,
          unknown
        >;
      },
    );

    return {
      cacheKey,
      kind: 'synthetic',
      module: synthetic,
    };
  }

  // Build a SyntheticModule or SourceTextModule for a `data:` URI specifier.
  // text/javascript SourceTextModules have their own static graph; deps are
  // walked here and pushed to the parent worklist.
  private _buildSyncDataUriEntry(
    specifier: string,
    cacheKey: string,
    context: VMContext,
    scratch: Map<string, ScratchEntry>,
    registry: ModuleRegistry | Map<string, JestModule>,
    worklist: Array<WorklistEntry>,
    mode: SyncEsmMode,
  ): ScratchEntry | null {
    const {mime, code} = parseDataUri(specifier);

    if (mime === 'application/wasm') {
      return this._buildSyncWasmEntry(
        new Uint8Array(code as Buffer),
        specifier,
        cacheKey,
        context,
        scratch,
        registry,
        worklist,
        mode,
      );
    }

    if (mime === 'application/json') {
      return {
        cacheKey,
        kind: 'synthetic',
        module: buildJsonSyntheticModule(code as string, specifier, context),
      };
    }

    // text/javascript - SourceTextModule with its own static graph.
    const module = new SourceTextModule(code as string, {
      context,
      identifier: specifier,
      importModuleDynamically: this._esmDynamicImport,
      initializeImportMeta(meta) {
        meta.url = specifier;
        if (meta.url.startsWith('file://')) {
          // @ts-expect-error Jest uses @types/node@18.
          meta.filename = fileURLToPath(meta.url);
          // @ts-expect-error Jest uses @types/node@18.
          meta.dirname = path.dirname(meta.filename);
        }
      },
    }) as VMModuleWithAsyncGraph;

    if (
      typeof module.hasTopLevelAwait === 'function' &&
      module.hasTopLevelAwait()
    ) {
      if (mode === 'sync-required') {
        throw makeRequireAsyncError(specifier, 'top-level await');
      }
      return null;
    }

    const requests = module.moduleRequests;
    if (requests === undefined) return null;
    const deps: Array<string> = [];
    for (const {specifier: depSpec} of requests) {
      const resolved = this._resolveSpecifierForSyncGraph(
        specifier,
        depSpec,
        context,
        scratch,
        registry,
        mode,
      );
      if (resolved === null) return null;
      deps.push(resolved.cacheKey);
      if (resolved.enqueue) worklist.push(resolved.enqueue);
    }

    return {cacheKey, deps, kind: 'source', module};
  }

  private async loadEsmModule(
    modulePath: string,
    query = '',
  ): Promise<ESModule> {
    // The sync core walks the graph synchronously, so it can only run when
    // the configured resolver supports sync resolution. With an async-only
    // user resolver `findNodeModule` silently falls back to the default
    // resolver and would silently miss user mappings; defer to legacy.
    if (supportsSyncEvaluate && this._resolution.canResolveSync()) {
      const synced = this._tryLoadEsmGraphSync(
        modulePath,
        query,
        'sync-preferred',
      );
      if (synced) return synced;
    }
    // LEGACY: pre-sync-core async ESM path. Delete this block (and the
    // `supportsSyncEvaluate` branches in this method and `linkAndEvaluateModule`)
    // when Jest's minimum Node version reaches v24.9.
    const cacheKey = modulePath + query;
    const registry = this.registries.getActiveEsmRegistry();

    if (this.transformCache.hasMutex(cacheKey)) {
      await this.transformCache.awaitMutex(cacheKey);
    }

    if (!registry.has(cacheKey)) {
      invariant(
        typeof this._environment.getVmContext === 'function',
        'ES Modules are only supported if your test environment has the `getVmContext` function',
      );

      const context = this._environment.getVmContext();

      invariant(context, 'Test environment has been torn down');

      let transformResolve: () => void;
      let transformReject: (error?: unknown) => void;

      this.transformCache.setMutex(
        cacheKey,
        new Promise((resolve, reject) => {
          transformResolve = resolve;
          transformReject = reject;
        }),
      );

      invariant(
        transformResolve! && transformReject!,
        'Promise initialization should be sync - please report this bug to Jest!',
      );

      if (isWasm(modulePath)) {
        const wasm = this._importWasmModule(
          this.fileCache.readFileBuffer(modulePath),
          modulePath,
          context,
        );

        registry.set(cacheKey, wasm);

        transformResolve();
        return wasm;
      }

      if (this._resolution.isCoreModule(modulePath)) {
        const core = this._importCoreModule(modulePath, context);
        registry.set(cacheKey, core);

        transformResolve();

        return core;
      }

      const transformedCode = this._scriptTransformer.canTransformSync(
        modulePath,
      )
        ? this.transformCache.transform(modulePath, ESM_TRANSFORM_OPTIONS)
        : await this.transformCache.transformAsync(
            modulePath,
            ESM_TRANSFORM_OPTIONS,
          );

      try {
        let module;
        if (modulePath.endsWith('.json')) {
          module = buildJsonSyntheticModule(
            transformedCode,
            modulePath,
            context,
          );
        } else {
          module = new SourceTextModule(transformedCode, {
            context,
            identifier: modulePath,
            importModuleDynamically: this._esmDynamicImport,
            initializeImportMeta: meta => {
              const metaUrl = pathToFileURL(modulePath).href;
              meta.url = metaUrl;

              // @ts-expect-error Jest uses @types/node@18. Will be fixed when updated to @types/node@20.11.0
              meta.filename = modulePath;
              // @ts-expect-error Jest uses @types/node@18. Will be fixed when updated to @types/node@20.11.0
              meta.dirname = path.dirname(modulePath);

              meta.resolve = (specifier, parent: string | URL = metaUrl) => {
                const parentPath = fileURLToPath(parent);
                return pathToFileURL(
                  this._resolution.resolveEsm(parentPath, specifier),
                ).href;
              };

              let jest = this.jestObjectCaches.get(modulePath);

              if (!jest) {
                jest = this._createJestObjectFor(modulePath);

                this.jestObjectCaches.set(modulePath, jest);
              }

              (meta as JestImportMeta).jest = jest;
            },
          });
        }

        invariant(
          !registry.has(cacheKey),
          `Module cache already has entry ${cacheKey}. This is a bug in Jest, please report it!`,
        );

        registry.set(cacheKey, module);

        transformResolve();
      } catch (error) {
        transformReject(error);
        throw error;
      }
    }

    const module = registry.get(cacheKey);

    invariant(
      module,
      'Module cache does not contain module. This is a bug in Jest, please open up an issue',
    );

    return module as ESModule;
  }

  private async resolveModule<T = unknown>(
    specifier: string,
    referencingIdentifier: string,
    context: VMContext,
  ): Promise<T> {
    if (this.testState === 'tornDown') {
      this._logFormattedReferenceError(
        'You are trying to `import` a file after the Jest environment has been torn down.',
      );
      process.exitCode = 1;
      // @ts-expect-error -- exiting
      return;
    }
    if (this.testState === 'betweenTests' && !supportsDynamicImport) {
      throw new ReferenceError(
        'You are trying to `import` a file outside of the scope of the test code.',
      );
    }

    const registry = this.registries.getActiveEsmRegistry();

    if (specifier === '@jest/globals') {
      const globalsIdentifier = `@jest/globals/${referencingIdentifier}`;
      const fromCache = registry.get(globalsIdentifier);

      if (fromCache) {
        return fromCache as T;
      }
      const globals = this.getGlobalsForEsm(referencingIdentifier, context);
      registry.set(globalsIdentifier, globals);

      return globals as T;
    }

    if (specifier.startsWith('data:')) {
      if (
        await this.mockState.shouldMockEsmAsync(
          referencingIdentifier,
          specifier,
        )
      ) {
        return this.importMock(referencingIdentifier, specifier, context);
      }

      const fromCache = registry.get(specifier);

      if (fromCache) {
        return fromCache as T;
      }

      const {mime, code} = parseDataUri(specifier);
      let module;
      if (mime === 'application/wasm') {
        module = await this._importWasmModule(
          new Uint8Array(code as Buffer),
          specifier,
          context,
        );
      } else if (mime === 'application/json') {
        module = buildJsonSyntheticModule(code as string, specifier, context);
      } else {
        module = new SourceTextModule(code as string, {
          context,
          identifier: specifier,
          importModuleDynamically: this._esmDynamicImport,
          initializeImportMeta(meta) {
            // no `jest` here as it's not loaded in a file
            meta.url = specifier;
            if (meta.url.startsWith('file://')) {
              // @ts-expect-error Jest uses @types/node@18.
              meta.filename = fileURLToPath(meta.url);
              // @ts-expect-error Jest uses @types/node@18.
              meta.dirname = path.dirname(meta.filename);
            }
          },
        });
      }

      registry.set(specifier, module);
      return module as T;
    }

    if (specifier.startsWith('file://')) {
      specifier = fileURLToPath(specifier);
    }

    const [specifierPath, query] = specifier.split('?');

    if (
      await this.mockState.shouldMockEsmAsync(
        referencingIdentifier,
        specifierPath,
      )
    ) {
      return this.importMock(referencingIdentifier, specifierPath, context);
    }

    const resolved = await this._resolution.resolveEsmAsync(
      referencingIdentifier,
      specifierPath,
    );

    if (
      // json files are modules when imported in modules
      resolved.endsWith('.json') ||
      this._resolution.isCoreModule(resolved) ||
      this.unstable_shouldLoadAsEsm(resolved)
    ) {
      return this.loadEsmModule(resolved, query) as T;
    }

    return this.loadCjsAsEsm(referencingIdentifier, resolved, context) as T;
  }

  private async linkAndEvaluateModule(module: VMModule): Promise<VMModule> {
    if (this.testState === 'tornDown') {
      this._logFormattedReferenceError(
        'You are trying to `import` a file after the Jest environment has been torn down.',
      );
      process.exitCode = 1;
      // @ts-expect-error: exiting early
      return;
    }
    if (this.testState === 'betweenTests' && !supportsDynamicImport) {
      throw new ReferenceError(
        'You are trying to `import` a file outside of the scope of the test code.',
      );
    }

    if (module.status === 'unlinked') {
      // since we might attempt to link the same module in parallel, stick the promise in a weak map so every call to
      // this method can await it
      this._esmModuleLinkingMap.set(
        module,
        module.link((specifier: string, referencingModule: VMModule) =>
          this.resolveModule(
            specifier,
            referencingModule.identifier,
            referencingModule.context,
          ),
        ),
      );
    }

    const linkPromise = this._esmModuleLinkingMap.get(module);
    if (linkPromise != null) {
      await linkPromise;
    } else if (module.status === 'linking') {
      // Module entered 'linking' via Node's cascade (a parent's link() recursed
      // into this dep without going through our code). We have no promise to
      // await, so yield via setImmediate - which lets all pending microtasks
      // (including Node's internal linker chain) drain - until linking finishes.
      const deadline = Date.now() + 5000; // sanity check to prevent infinite loop
      while (module.status === 'linking') {
        if (Date.now() > deadline) {
          throw new Error(
            `Jest: module ${module.identifier} is stuck in 'linking' state after 5 s - ` +
              'this is likely a bug in Jest (please report it).',
          );
        }
        await new Promise<void>(resolve => setImmediate(resolve));
      }
    }

    if (module.status === 'linked') {
      if (supportsSyncEvaluate && !moduleHasAsyncGraph(module)) {
        // `evaluate()` fulfills synchronously when the graph has no top-level
        // await, so we don't need to yield to the event loop. The Promise
        // always resolves (never rejects) for sync modules; errors are
        // reflected in `module.status === 'errored'` instead.
        void module.evaluate();
        const status = module.status as VMModule['status'];
        if (status === 'errored') {
          throw module.error;
        }
        invariant(
          status === 'evaluated',
          `Expected synchronous evaluation to complete for ${module.identifier}, but module status is "${status}". This is a bug in Jest, please report it!`,
        );
      } else {
        // Store the evaluate promise so concurrent callers that find the module
        // in 'evaluating' state can await the same promise instead of skipping.
        const evalPromise = module.evaluate() as Promise<void>;
        this._esmModuleEvaluatingMap.set(module, evalPromise);
      }
    }

    await this._esmModuleEvaluatingMap.get(module);

    return module;
  }

  async unstable_importModule(
    from: string,
    moduleName?: string,
  ): Promise<unknown | void> {
    invariant(
      runtimeSupportsVmModules,
      'You need to run with a version of node that supports ES Modules in the VM API. See https://jestjs.io/docs/ecmascript-modules',
    );

    const [path, query] = (moduleName ?? '').split('?');

    const modulePath = await this._resolution.resolveEsmAsync(from, path);

    const module = await this.loadEsmModule(modulePath, query);

    return this.linkAndEvaluateModule(module);
  }

  // Build the SyntheticModule shell that wraps a CJS module so it can be
  // imported as ESM. Returns it unevaluated; legacy callers wrap with
  // `evaluateSyntheticModule`, sync callers plug it into `linkRequests`.
  // CJS loaded via `import` shares cache with other CJS: https://github.com/nodejs/modules/issues/503
  private _buildCjsAsEsmSyntheticModule(
    from: string,
    modulePath: string,
    context: VMContext,
  ): SyntheticModule {
    return buildCjsAsEsmSyntheticModule(
      from,
      modulePath,
      context,
      (from, moduleName) => this.requireModuleOrMock(from, moduleName),
      this.cjsExportsCache,
    );
  }

  private loadCjsAsEsm(
    from: string,
    modulePath: string,
    context: VMContext,
  ): SyntheticModule | Promise<VMModule> {
    const registry = this.registries.getActiveEsmRegistry();
    const cached = registry.get(modulePath);
    if (cached) {
      return cached as SyntheticModule | Promise<VMModule>;
    }

    let synthetic: SyntheticModule;
    try {
      synthetic = this._buildCjsAsEsmSyntheticModule(from, modulePath, context);
    } catch (error) {
      if (!isCjsParseError(error)) {
        throw error;
      }
      // The file may contain ESM syntax with no ESM marker (.mjs /
      // "type":"module") - try loading as native ESM. If the ESM parser also
      // rejects it, the original CJS error was the genuine one; surface it
      // instead of the (less useful) ESM diagnostic.
      return this.loadEsmModule(modulePath).catch(esmError => {
        throw isError(esmError) && esmError.name === 'SyntaxError'
          ? error
          : esmError;
      });
    }

    const evaluated = evaluateSyntheticModule(synthetic);
    registry.set(modulePath, evaluated);
    return evaluated;
  }

  private async importMock<T = unknown>(
    from: string,
    moduleName: string,
    context: VMContext,
  ): Promise<T> {
    const moduleID = await this.mockState.getEsmModuleIdAsync(from, moduleName);

    if (this.registries.hasModuleMock(moduleID)) {
      return this.registries.getModuleMock(moduleID) as T;
    }

    const factory = this.mockState.getEsmFactory(moduleID);
    if (factory) {
      const invokedFactory = (await factory()) as Record<string, unknown>;

      const module = new SyntheticModule(
        Object.keys(invokedFactory),
        function () {
          for (const [key, value] of Object.entries(invokedFactory)) {
            this.setExport(key, value);
          }
        },
        {context, identifier: moduleName},
      );

      this.registries.setModuleMock(moduleID, module);

      return evaluateSyntheticModule(module) as T;
    }

    throw new Error('Attempting to import a mock without a factory');
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

  private _buildCoreSyntheticModule(
    moduleName: string,
    context: VMContext,
  ): SyntheticModule {
    return buildCoreSyntheticModule(
      moduleName,
      context,
      (name, supportPrefix) => this.coreModule.require(name, supportPrefix),
    );
  }

  private _importCoreModule(moduleName: string, context: VMContext) {
    return evaluateSyntheticModule(
      this._buildCoreSyntheticModule(moduleName, context),
    );
  }

  private async _importWasmModule(
    source: BufferSource,
    identifier: string,
    context: VMContext,
  ) {
    // Use async `WebAssembly.compile` here (rather than the sync constructor
    // used by the v24.9+ sync core) to avoid blocking the event loop on large
    // wasm modules in the legacy async path.
    const wasmModule = await WebAssembly.compile(source);
    const moduleLookup: Record<string, VMModule> = {};
    for (const {module} of WebAssembly.Module.imports(wasmModule)) {
      if (moduleLookup[module] === undefined) {
        const resolvedModule = await this.resolveModule<VMModule>(
          module,
          identifier,
          context,
        );

        // Do NOT call linkAndEvaluateModule here: we are executing inside the
        // linker callback for the parent module, so Node's cascade may already
        // be linking resolvedModule. Calling linkAndEvaluateModule would spin-
        // wait via setImmediate, but the cascade can't finish until this linker
        // returns - deadlock. The SyntheticModule's evaluate function below
        // accesses namespace only after Node has fully evaluated all deps in
        // topological order, so the module will be ready by then.
        moduleLookup[module] = resolvedModule;
      }
    }
    return buildWasmSyntheticModule(
      wasmModule,
      identifier,
      context,
      depSpec => moduleLookup[depSpec].namespace as Record<string, unknown>,
    );
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

  // Shared async dynamic-import callback: installed on every SourceTextModule
  // we construct (file, data: URI). Calls into resolveModule + linkAndEvaluate
  // - the dynamic import is async by language regardless of Node version.
  private _esmDynamicImport = async (
    specifier: string,
    referencingModule: VMModule,
  ): Promise<VMModule> => {
    invariant(
      runtimeSupportsVmModules,
      'You need to run with a version of node that supports ES Modules in the VM API. See https://jestjs.io/docs/ecmascript-modules',
    );
    if (this.testState === 'betweenTests') {
      throw new ReferenceError(
        'You are trying to `import` a file outside of the scope of the test code.',
      );
    }
    if (this.testState === 'tornDown') {
      this._logFormattedReferenceError(
        'You are trying to `import` a file after the Jest environment has been torn down.',
      );
      process.exitCode = 1;
      throw new ReferenceError(
        'You are trying to `import` a file after the Jest environment has been torn down.',
      );
    }
    const dyn = await this.resolveModule<VMModule>(
      specifier,
      referencingModule.identifier,
      referencingModule.context,
    );
    return this.linkAndEvaluateModule(dyn);
  };

  private _buildJestGlobalsSyntheticModule(
    from: string,
    context: VMContext,
  ): SyntheticModule {
    return buildJestGlobalsSyntheticModule(
      from,
      context,
      jestFor => this._getOrCreateJest(jestFor),
      () => this.getGlobalsFromEnvironment(),
    );
  }

  private _getOrCreateJest(from: string): Jest {
    let jest = this.jestObjectCaches.get(from);

    if (!jest) {
      jest = this._createJestObjectFor(from);

      this.jestObjectCaches.set(from, jest);
    }
    return jest;
  }

  private getGlobalsForEsm(
    from: string,
    context: VMContext,
  ): SyntheticModule | Promise<SyntheticModule> {
    return evaluateSyntheticModule(
      this._buildJestGlobalsSyntheticModule(from, context),
    );
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
