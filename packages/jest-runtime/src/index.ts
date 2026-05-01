/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import nativeModule from 'module';
import * as path from 'path';
import {URL, fileURLToPath, pathToFileURL} from 'url';
import {isNativeError} from 'util/types';
import {
  SourceTextModule,
  SyntheticModule,
  type Context as VMContext,
  type Module as VMModule,
  compileFunction,
} from 'vm';
import {parse as parseCjs} from 'cjs-module-lexer';
import {CoverageInstrumenter, type V8Coverage} from 'collect-v8-coverage';
import * as fs from 'graceful-fs';
import slash from 'slash';
import stripBOM from 'strip-bom';
import type {
  Jest,
  JestEnvironment,
  JestImportMeta,
  Module,
  ModuleWrapper,
} from '@jest/environment';
import type {LegacyFakeTimers, ModernFakeTimers} from '@jest/fake-timers';
import type {expect, jest} from '@jest/globals';
import type {SourceMapRegistry} from '@jest/source-map';
import type {TestContext, V8CoverageResult} from '@jest/test-result';
import {
  type CallerTransformOptions,
  type ScriptTransformer,
  type ShouldInstrumentOptions,
  type TransformResult,
  type TransformationOptions,
  handlePotentialSyntaxError,
  shouldInstrument,
} from '@jest/transform';
import type {Config, Global} from '@jest/types';
import HasteMap, {type IHasteMap, type IModuleMap} from 'jest-haste-map';
import {formatStackTrace, separateMessageFromStack} from 'jest-message-util';
import type {MockMetadata, ModuleMocker} from 'jest-mock';
import {escapePathForRegex} from 'jest-regex-util';
import Resolver, {type ResolveModuleConfig} from 'jest-resolve';
import {EXTENSION as SnapshotExtension} from 'jest-snapshot';
import {
  createDirectory,
  deepCyclicCopy,
  invariant,
  isNonNullable,
  protectProperties,
} from 'jest-util';
import {
  createOutsideJestVmPath,
  decodePossibleOutsideJestVmPath,
  findSiblingsWithFileExtension,
} from './helpers';

const esmIsAvailable = typeof SourceTextModule === 'function';
const supportsDynamicImport = esmIsAvailable;

const isError =
  typeof Error.isError === 'function' ? Error.isError : isNativeError;

const dataURIRegex =
  /^data:(?<mime>text\/javascript|application\/json|application\/wasm)(?:;(?<encoding>charset=utf-8|base64))?,(?<code>.*)$/;

interface JestGlobals extends Global.TestFrameworkGlobals {
  expect: typeof expect;
}

interface JestGlobalsWithJest extends JestGlobals {
  jest: typeof jest;
}

type HasteMapOptions = {
  console?: Console;
  maxWorkers: number;
  resetCache: boolean;
  watch?: boolean;
  watchman: boolean;
  workerThreads?: boolean;
};

interface InternalModuleOptions extends Required<CallerTransformOptions> {
  isInternalModule: boolean;
}

const defaultTransformOptions: InternalModuleOptions = {
  isInternalModule: false,
  supportsDynamicImport: esmIsAvailable,
  supportsExportNamespaceFrom: false,
  supportsStaticESM: false,
  supportsTopLevelAwait: false,
};

type InitialModule = Omit<Module, 'require' | 'parent' | 'paths'>;
type ModuleRegistry = Map<string, InitialModule | Module | JestModule>;

// These are modules that we know
// * are safe to require from the outside (not stateful, not prone to errors passing in instances from different realms), and
// * take sufficiently long to require to warrant an optimization.
// When required from the outside, they use the worker's require cache and are thus
// only loaded once per worker, not once per test file.
// Use /benchmarks/test-file-overhead to measure the impact.
// Note that this only applies when they are required in an internal context;
// users who require one of these modules in their tests will still get the module from inside the VM.
// Prefer listing a module here only if it is impractical to use the jest-resolve-outside-vm-option where it is required,
// e.g. because there are many require sites spread across the dependency graph.
const INTERNAL_MODULE_REQUIRE_OUTSIDE_OPTIMIZED_MODULES = new Set(['chalk']);
const JEST_RESOLVE_OUTSIDE_VM_OPTION = Symbol.for(
  'jest-resolve-outside-vm-option',
);
type ResolveOptions = Parameters<typeof require.resolve>[1] & {
  [JEST_RESOLVE_OUTSIDE_VM_OPTION]?: true;
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

const isWasm = (modulePath: string): boolean => modulePath.endsWith('.wasm');

const unmockRegExpCache = new WeakMap();

const runtimeSupportsVmModules = typeof SyntheticModule === 'function';

const supportsSyncEvaluate =
  // @ts-expect-error - `hasAsyncGraph` is in Node v24.9+, not yet typed in @types/node@18
  typeof SourceTextModule?.prototype.hasAsyncGraph === 'function';

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

const supportsNodeColonModulePrefixInRequire = (() => {
  try {
    require('node:fs');

    return true;
  } catch {
    return false;
  }
})();

type ESModule = VMModule | SyntheticModule;
type JestModule = ESModule | Promise<ESModule>;

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

const ESM_TRANSFORM_OPTIONS: InternalModuleOptions = {
  isInternalModule: false,
  supportsDynamicImport: true,
  supportsExportNamespaceFrom: true,
  supportsStaticESM: true,
  supportsTopLevelAwait: true,
};

type ScratchEntry = {
  cacheKey: string;
  module: VMModuleWithAsyncGraph;
  isSourceText: boolean;
  // cache keys, populated for source-text modules; null otherwise.
  deps: Array<string> | null;
};

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
  private readonly _cacheFS: Map<string, string>;
  private readonly _cacheFSBuffer = new Map<string, BufferSource>();
  private readonly _config: Config.ProjectConfig;
  private readonly _globalConfig: Config.GlobalConfig;
  private readonly _coverageOptions: ShouldInstrumentOptions;
  private _currentlyExecutingModulePath: string;
  private readonly _environment: JestEnvironment;
  private readonly _explicitShouldMock: Map<string, boolean>;
  private readonly _explicitShouldMockModule: Map<string, boolean>;
  private readonly _onGenerateMock: Set<
    (moduleName: string, moduleMock: any) => any
  >;
  private _fakeTimersImplementation:
    | LegacyFakeTimers<unknown>
    | ModernFakeTimers
    | null;
  private readonly _internalModuleRegistry: ModuleRegistry;
  private _isCurrentlyExecutingManualMock: string | null;
  private _mainModule: Module | null;
  private readonly _mockFactories: Map<string, () => unknown>;
  private readonly _mockMetaDataCache: Map<string, MockMetadata<any>>;
  private _mockRegistry: Map<string, any>;
  private _isolatedMockRegistry: Map<string, any> | null;
  private readonly _moduleMockRegistry: Map<string, JestModule>;
  private readonly _moduleMockFactories: Map<string, () => unknown>;
  private readonly _moduleMocker: ModuleMocker;
  private _isolatedModuleRegistry: ModuleRegistry | null;
  private _moduleRegistry: ModuleRegistry;
  private readonly _esmoduleRegistry: Map<string, JestModule>;
  private readonly _cjsNamedExports: Map<string, Set<string>>;
  private readonly _esmModuleLinkingMap: WeakMap<JestModule, Promise<unknown>>;
  private readonly _esmModuleEvaluatingMap: WeakMap<JestModule, Promise<void>>;
  private readonly _testPath: string;
  private readonly _resolver: Resolver;
  private _shouldAutoMock: boolean;
  private readonly _shouldMockModuleCache: Map<string, boolean>;
  private readonly _shouldUnmockTransitiveDependenciesCache: Map<
    string,
    boolean
  >;
  private readonly _sourceMapRegistry: SourceMapRegistry;
  private readonly _scriptTransformer: ScriptTransformer;
  private readonly _fileTransforms: Map<string, TransformResult>;
  private readonly _fileTransformsMutex: Map<string, Promise<void>>;
  private _v8CoverageInstrumenter: CoverageInstrumenter | undefined;
  private _v8CoverageResult: V8Coverage | undefined;
  private _v8CoverageSources: Map<string, TransformResult> | undefined;
  private readonly _transitiveShouldMock: Map<string, boolean>;
  private _unmockList: RegExp | undefined;
  private readonly _virtualMocks: Map<string, boolean>;
  private readonly _virtualModuleMocks: Map<string, boolean>;
  private _moduleImplementation?: typeof nativeModule.Module;
  private readonly jestObjectCaches: Map<string, Jest>;
  private jestGlobals?: JestGlobals;
  private readonly esmConditions: Array<string>;
  private readonly cjsConditions: Array<string>;
  private isTornDown = false;
  private isInsideTestCode: boolean | undefined;
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
    this._cacheFS = cacheFS;
    this._config = config;
    this._coverageOptions = coverageOptions;
    this._currentlyExecutingModulePath = '';
    this._environment = environment;
    this._globalConfig = globalConfig;
    this._explicitShouldMock = new Map();
    this._explicitShouldMockModule = new Map();
    this._onGenerateMock = new Set();
    this._internalModuleRegistry = new Map();
    this._isCurrentlyExecutingManualMock = null;
    this._mainModule = null;
    this._mockFactories = new Map();
    this._mockRegistry = new Map();
    this._moduleMockRegistry = new Map();
    this._moduleMockFactories = new Map();
    invariant(
      this._environment.moduleMocker,
      '`moduleMocker` must be set on an environment when created',
    );
    this._moduleMocker = this._environment.moduleMocker;
    this._isolatedModuleRegistry = null;
    this._isolatedMockRegistry = null;
    this._moduleRegistry = new Map();
    this._esmoduleRegistry = new Map();
    this._cjsNamedExports = new Map();
    this._esmModuleLinkingMap = new WeakMap();
    this._esmModuleEvaluatingMap = new WeakMap();
    this._testPath = testPath;
    this._resolver = resolver;
    this._scriptTransformer = transformer;
    this._shouldAutoMock = config.automock;
    this._sourceMapRegistry = new Map();
    this._fileTransforms = new Map();
    this._fileTransformsMutex = new Map();
    this._virtualMocks = new Map();
    this._virtualModuleMocks = new Map();
    this.jestObjectCaches = new Map();

    this._mockMetaDataCache = new Map();
    this._shouldMockModuleCache = new Map();
    this._shouldUnmockTransitiveDependenciesCache = new Map();
    this._transitiveShouldMock = new Map();

    this._fakeTimersImplementation = config.fakeTimers.legacyFakeTimers
      ? this._environment.fakeTimers
      : this._environment.fakeTimersModern;

    this._unmockList = unmockRegExpCache.get(config);
    if (!this._unmockList && config.unmockedModulePathPatterns) {
      this._unmockList = new RegExp(
        config.unmockedModulePathPatterns.join('|'),
      );
      unmockRegExpCache.set(config, this._unmockList);
    }

    const envExportConditions = this._environment.exportConditions?.() ?? [];

    this.esmConditions = [
      ...new Set(['import', 'default', ...envExportConditions]),
    ];
    this.cjsConditions = [
      ...new Set(['require', 'node', 'default', ...envExportConditions]),
    ];

    if (config.automock) {
      for (const filePath of config.setupFiles) {
        if (filePath.includes(NODE_MODULES)) {
          const moduleID = this._resolver.getModuleID(
            this._virtualMocks,
            filePath,
            undefined,
            // shouldn't really matter, but in theory this will make sure the caching is correct
            {
              conditions: this.unstable_shouldLoadAsEsm(filePath)
                ? this.esmConditions
                : this.cjsConditions,
            },
          );
          this._transitiveShouldMock.set(moduleID, false);
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
    return (
      isWasm(modulePath) ||
      Resolver.unstable_shouldLoadAsEsm(
        modulePath,
        this._config.extensionsToTreatAsEsm,
      )
    );
  }

  // Synchronous graph loader for Node v24.9+. Walks the static import graph
  // depth-first, constructs every node, links via `linkRequests`, instantiates
  // the root, and evaluates synchronously. Returns the fully-evaluated root.
  // The dispatch wrapper additionally guards on `_resolver.canResolveSync()`,
  // so this method assumes synchronous resolution is available.
  // Returns `null` when the graph cannot be completed synchronously (async
  // transformer, TLA, async mock factory) and the caller must fall back to
  // the legacy async path. Note that some modules — core modules, the
  // `@jest/globals` synthetic, CJS-as-ESM wrappers, mocked specifiers — are
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
    if (this.isTornDown) {
      this._logFormattedReferenceError(
        'You are trying to `import` a file after the Jest environment has been torn down.',
      );
      process.exitCode = 1;
      return null;
    }
    if (this.isInsideTestCode === false && !supportsDynamicImport) {
      throw new ReferenceError(
        'You are trying to `import` a file outside of the scope of the test code.',
      );
    }
    invariant(
      typeof this._environment.getVmContext === 'function',
      'ES Modules are only supported if your test environment has the `getVmContext` function',
    );
    const context = this._environment.getVmContext();
    invariant(context, 'Test environment has been torn down');

    const registry = this._isolatedModuleRegistry ?? this._esmoduleRegistry;
    const rootKey = rootPath + rootQuery;

    const cached = registry.get(rootKey);
    if (cached && !(cached instanceof Promise)) {
      // Already loaded; legacy may have stashed a Promise here, in which case
      // we must defer.
      return cached as ESModule;
    }
    if (cached instanceof Promise) {
      return null;
    }

    // The legacy async path may be mid-flight on this module from a previous
    // top-level call — for example, `module.link(asyncLinker)` fans out to
    // deps, the linker calls back into `loadEsmModule`, and that call routes
    // here while legacy still holds the mutex on the parent's
    // `transformFileAsync`. Defer to legacy in that case so we await its
    // in-flight transform rather than starting a parallel one.
    if (this._fileTransformsMutex.has(rootKey)) return null;

    const scratch = new Map<string, ScratchEntry>();
    const worklist: Array<WorklistEntry> = [
      {cacheKey: rootKey, modulePath: rootPath},
    ];

    while (worklist.length > 0) {
      const {cacheKey, modulePath} = worklist.pop()!;
      if (scratch.has(cacheKey)) continue;

      // Same rationale as the root-level mutex check above: a different
      // top-level legacy load may already be transforming this dep.
      if (this._fileTransformsMutex.has(cacheKey)) return null;

      const fromRegistry = registry.get(cacheKey);
      if (fromRegistry && !(fromRegistry instanceof Promise)) {
        scratch.set(cacheKey, {
          cacheKey,
          deps: null,
          isSourceText: false,
          module: fromRegistry as VMModuleWithAsyncGraph,
        });
        continue;
      }
      if (fromRegistry instanceof Promise) return null;

      let module: VMModuleWithAsyncGraph;
      let deps: Array<string> | null = null;

      if (this._resolver.isCoreModule(modulePath)) {
        scratch.set(cacheKey, {
          cacheKey,
          deps: null,
          isSourceText: false,
          module: this._buildCoreSyntheticModule(
            modulePath,
            context,
          ) as VMModuleWithAsyncGraph,
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
          this.readFileBuffer(modulePath),
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
        // Async transformer required for this file — bail.
        return null;
      }

      if (modulePath.endsWith('.json')) {
        module = this._buildJsonSyntheticModule(
          this.transformFile(modulePath, ESM_TRANSFORM_OPTIONS),
          modulePath,
          context,
        ) as VMModuleWithAsyncGraph;
      } else {
        const transformedCode = this.transformFile(
          modulePath,
          ESM_TRANSFORM_OPTIONS,
        );

        module = new SourceTextModule(transformedCode, {
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
              const resolvedPath = this._resolver.resolveModule(
                parentPath,
                specifier,
                {conditions: this.esmConditions},
              );
              return pathToFileURL(resolvedPath).href;
            };
            let jest = this.jestObjectCaches.get(modulePath);
            if (!jest) {
              jest = this._createJestObjectFor(modulePath);
              this.jestObjectCaches.set(modulePath, jest);
            }
            (meta as JestImportMeta).jest = jest;
          },
        }) as VMModuleWithAsyncGraph;

        // Top-level await is detectable per-module before we walk further.
        // Bailing now skips construction of every node still on the worklist
        // (a transitive TLA elsewhere in the graph would be caught later by
        // the post-instantiate `hasAsyncGraph()` check; this one cuts off the
        // common "TLA at the entry file" case before doing any more work).
        if (
          typeof module.hasTopLevelAwait === 'function' &&
          module.hasTopLevelAwait()
        ) {
          return null;
        }

        // Walk dependencies via the v24.9+ `moduleRequests` accessor.
        const requests = module.moduleRequests;
        if (requests === undefined) return null;
        deps = [];
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
      }

      scratch.set(cacheKey, {
        cacheKey,
        deps,
        isSourceText: !modulePath.endsWith('.json'),
        module,
      });
    }

    // Link every source-text module to its deps. SyntheticModule entries are
    // born 'linked' and have no `linkRequests` of their own; they plug into
    // the parent's `linkRequests` array directly.
    for (const entry of scratch.values()) {
      if (!entry.isSourceText || entry.deps === null) continue;
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

    if (rootEntry.isSourceText) {
      invariant(
        typeof rootModule.instantiate === 'function',
        'instantiate unavailable on root',
      );
      rootModule.instantiate();

      if (moduleHasAsyncGraph(rootModule)) {
        // TLA somewhere in the graph — bail to legacy async path.
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
    // sync when hasAsyncGraph() is false (checked above).
    void rootModule.evaluate();
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

  // Resolve one static-import specifier for the sync graph walker. Returns
  // null on any async-edge or unsupported case so the caller can bail.
  //
  // Side effects: for `@jest/globals`, mocked specifiers, and CJS-as-ESM
  // wrappers this commits the constructed SyntheticModule to both the local
  // `scratch` and the long-lived `registry`/`_moduleMockRegistry` before
  // returning. Source-text and JSON deps are only enqueued (the parent
  // worklist commits them on success). A subsequent bail does not unwind
  // these eager commits — see `_tryLoadEsmGraphSync`'s header for the
  // implications.
  private _resolveSpecifierForSyncGraph(
    referencingIdentifier: string,
    specifier: string,
    context: VMContext,
    scratch: Map<string, ScratchEntry>,
    registry: ModuleRegistry | Map<string, JestModule>,
    mode: SyncEsmMode,
  ): {cacheKey: string; enqueue: WorklistEntry | null} | null {
    if (specifier === '@jest/globals') {
      const globalsIdentifier = `@jest/globals/${referencingIdentifier}`;
      const fromRegistry = registry.get(globalsIdentifier);
      if (fromRegistry instanceof Promise) return null;

      const module =
        (fromRegistry as VMModuleWithAsyncGraph | undefined) ??
        (this._buildJestGlobalsSyntheticModule(
          referencingIdentifier,
          context,
        ) as VMModuleWithAsyncGraph);
      if (!fromRegistry) {
        registry.set(globalsIdentifier, module);
      }
      if (!scratch.has(globalsIdentifier)) {
        scratch.set(globalsIdentifier, {
          cacheKey: globalsIdentifier,
          deps: null,
          isSourceText: false,
          module,
        });
      }
      return {cacheKey: globalsIdentifier, enqueue: null};
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
      this._shouldMockModuleSync(
        referencingIdentifier,
        specifierPath,
        this._explicitShouldMockModule,
      )
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

    if (this._resolver.isCoreModule(specifierPath)) {
      const cacheKey = specifierPath + query;
      return {
        cacheKey,
        enqueue: {cacheKey, modulePath: specifierPath},
      };
    }

    let resolved: string;
    try {
      resolved = this._resolveModuleSync(referencingIdentifier, specifierPath);
    } catch {
      return null;
    }

    const cacheKey = resolved + query;
    if (
      !resolved.endsWith('.json') &&
      !isWasm(resolved) &&
      !this.unstable_shouldLoadAsEsm(resolved)
    ) {
      // CJS-as-ESM: build the SyntheticModule sync via the shared helper and
      // commit it. SyntheticModule is born 'linked', so the parent's
      // `linkRequests([syn])` will plug it in directly.
      if (!scratch.has(cacheKey)) {
        const fromRegistry = registry.get(cacheKey);
        if (fromRegistry instanceof Promise) return null;
        const module =
          (fromRegistry as VMModuleWithAsyncGraph | undefined) ??
          (this._buildCjsAsEsmSyntheticModule(
            referencingIdentifier,
            resolved,
            context,
          ) as VMModuleWithAsyncGraph);
        if (!fromRegistry) registry.set(cacheKey, module);
        scratch.set(cacheKey, {
          cacheKey,
          deps: null,
          isSourceText: false,
          module,
        });
      }
      return {cacheKey, enqueue: null};
    }

    return {
      cacheKey,
      enqueue: {cacheKey, modulePath: resolved},
    };
  }

  // Sync mirror of `importMock`. Returns null when the mock factory is async
  // (Promise-returning) or absent — the caller bails to the legacy path.
  private _importMockSync(
    from: string,
    moduleName: string,
    context: VMContext,
    scratch: Map<string, ScratchEntry>,
    _mode: SyncEsmMode,
  ): {cacheKey: string} | null {
    const moduleID = this._resolver.getModuleID(
      this._virtualModuleMocks,
      from,
      moduleName,
      {conditions: this.esmConditions},
    );

    const existing = this._moduleMockRegistry.get(moduleID);
    if (existing instanceof Promise) return null;
    if (existing) {
      if (!scratch.has(moduleID)) {
        scratch.set(moduleID, {
          cacheKey: moduleID,
          deps: null,
          isSourceText: false,
          module: existing as unknown as VMModuleWithAsyncGraph,
        });
      }
      return {cacheKey: moduleID};
    }

    const factory = this._moduleMockFactories.get(moduleID);
    if (factory === undefined) return null;

    const result = factory();
    if (
      result !== null &&
      typeof result === 'object' &&
      typeof (result as {then?: unknown}).then === 'function'
    ) {
      // Async factory — sync path can't await; fall back to legacy.
      return null;
    }

    const synth = buildMockSyntheticModule(
      moduleName,
      context,
      result as Record<string, unknown>,
    );
    this._moduleMockRegistry.set(moduleID, synth);
    scratch.set(moduleID, {
      cacheKey: moduleID,
      deps: null,
      isSourceText: false,
      module: synth as VMModuleWithAsyncGraph,
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

    const synthetic = this._buildWasmSyntheticModule(
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
      deps: null,
      isSourceText: false,
      module: synthetic as VMModuleWithAsyncGraph,
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
        deps: null,
        isSourceText: false,
        module: this._buildJsonSyntheticModule(
          code as string,
          specifier,
          context,
        ) as VMModuleWithAsyncGraph,
      };
    }

    // text/javascript — SourceTextModule with its own static graph.
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

    return {cacheKey, deps, isSourceText: true, module};
  }

  private async loadEsmModule(
    modulePath: string,
    query = '',
  ): Promise<ESModule> {
    // The sync core walks the graph synchronously, so it can only run when
    // the configured resolver supports sync resolution. With an async-only
    // user resolver `findNodeModule` silently falls back to the default
    // resolver and would silently miss user mappings; defer to legacy.
    if (supportsSyncEvaluate && this._resolver.canResolveSync()) {
      const synced = this._tryLoadEsmGraphSync(
        modulePath,
        query,
        'sync-preferred',
      );
      if (synced) return synced;
    }
    // LEGACY: pre-v24.9 async ESM path. Delete this block (and the
    // `supportsSyncEvaluate` branches in this method and `linkAndEvaluateModule`)
    // when Jest's minimum Node version reaches v24.9.
    const cacheKey = modulePath + query;
    const registry = this._isolatedModuleRegistry ?? this._esmoduleRegistry;

    if (this._fileTransformsMutex.has(cacheKey)) {
      await this._fileTransformsMutex.get(cacheKey);
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

      this._fileTransformsMutex.set(
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
          this.readFileBuffer(modulePath),
          modulePath,
          context,
        );

        registry.set(cacheKey, wasm);

        transformResolve();
        return wasm;
      }

      if (this._resolver.isCoreModule(modulePath)) {
        const core = this._importCoreModule(modulePath, context);
        registry.set(cacheKey, core);

        transformResolve();

        return core;
      }

      const transformedCode = this._scriptTransformer.canTransformSync(
        modulePath,
      )
        ? this.transformFile(modulePath, ESM_TRANSFORM_OPTIONS)
        : await this.transformFileAsync(modulePath, ESM_TRANSFORM_OPTIONS);

      try {
        let module;
        if (modulePath.endsWith('.json')) {
          module = this._buildJsonSyntheticModule(
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

                const resolvedPath = this._resolver.resolveModule(
                  parentPath,
                  specifier,
                  {conditions: this.esmConditions},
                );

                return pathToFileURL(resolvedPath).href;
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
    if (this.isTornDown) {
      this._logFormattedReferenceError(
        'You are trying to `import` a file after the Jest environment has been torn down.',
      );
      process.exitCode = 1;
      // @ts-expect-error -- exiting
      return;
    }
    if (this.isInsideTestCode === false && !supportsDynamicImport) {
      throw new ReferenceError(
        'You are trying to `import` a file outside of the scope of the test code.',
      );
    }

    const registry = this._isolatedModuleRegistry ?? this._esmoduleRegistry;

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
        await this._shouldMockModule(
          referencingIdentifier,
          specifier,
          this._explicitShouldMockModule,
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
        module = this._buildJsonSyntheticModule(
          code as string,
          specifier,
          context,
        );
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
      await this._shouldMockModule(
        referencingIdentifier,
        specifierPath,
        this._explicitShouldMockModule,
      )
    ) {
      return this.importMock(referencingIdentifier, specifierPath, context);
    }

    const resolved = await this._resolveModule(
      referencingIdentifier,
      specifierPath,
    );

    if (
      // json files are modules when imported in modules
      resolved.endsWith('.json') ||
      this._resolver.isCoreModule(resolved) ||
      this.unstable_shouldLoadAsEsm(resolved)
    ) {
      return this.loadEsmModule(resolved, query) as T;
    }

    return this.loadCjsAsEsm(referencingIdentifier, resolved, context) as T;
  }

  private async linkAndEvaluateModule(module: VMModule): Promise<VMModule> {
    if (this.isTornDown) {
      this._logFormattedReferenceError(
        'You are trying to `import` a file after the Jest environment has been torn down.',
      );
      process.exitCode = 1;
      // @ts-expect-error: exiting early
      return;
    }
    if (this.isInsideTestCode === false && !supportsDynamicImport) {
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
      // await, so yield via setImmediate — which lets all pending microtasks
      // (including Node's internal linker chain) drain — until linking finishes.
      const deadline = Date.now() + 5000; // sanity check to prevent infinite loop
      while (module.status === 'linking') {
        if (Date.now() > deadline) {
          throw new Error(
            `Jest: module ${module.identifier} is stuck in 'linking' state after 5 s — ` +
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

    const modulePath = await this._resolveModule(from, path);

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
    const cjs = this.requireModuleOrMock(from, modulePath);

    const parsedExports = this.getExportsOfCjs(modulePath);

    // CJS modules can legally set `module.exports` to `null` or a primitive.
    const cjsRecord =
      typeof cjs === 'object' && cjs !== null
        ? (cjs as Record<string, unknown>)
        : null;

    // Merge static analysis with runtime keys: cjs-module-lexer can't detect
    // all export patterns (e.g. Object.assign-style). Since we've already
    // required the module, Object.keys() gives the ground truth.
    const allCandidates = new Set([
      ...parsedExports,
      ...(cjsRecord ? Object.keys(cjsRecord) : []),
    ]);

    const cjsExports = [...allCandidates].filter(exportName => {
      // we don't wanna respect any exports _named_ default as a named export
      // __esModule is a Babel/Webpack metadata flag, not a real export
      if (exportName === 'default' || exportName === '__esModule') {
        return false;
      }
      return cjsRecord
        ? Object.hasOwnProperty.call(cjsRecord, exportName)
        : false;
    });

    // Unwrap Babel/Webpack __esModule convention: if the CJS file signals it
    // was originally ESM (transpiled), use cjs.default as the ESM default.
    const defaultExport =
      cjsRecord?.__esModule === true ? cjsRecord.default : cjs;

    return new SyntheticModule(
      [...cjsExports, 'default'],
      function () {
        for (const exportName of cjsExports) {
          // @ts-expect-error: TS doesn't know what `this` is
          this.setExport(exportName, cjs[exportName]);
        }
        this.setExport('default', defaultExport);
      },
      {context, identifier: modulePath},
    );
  }

  private loadCjsAsEsm(from: string, modulePath: string, context: VMContext) {
    const registry = this._isolatedModuleRegistry ?? this._esmoduleRegistry;
    const cached = registry.get(modulePath);
    if (cached) {
      return cached as SyntheticModule | Promise<SyntheticModule>;
    }

    let synthetic: SyntheticModule;
    try {
      synthetic = this._buildCjsAsEsmSyntheticModule(from, modulePath, context);
    } catch (error) {
      // Use .name check instead of instanceof: the error comes from
      // vm.compileFunction with a sandbox parsingContext, so its prototype
      // may cross context boundaries.
      if ((error as Error).name !== 'SyntaxError') {
        throw error;
      }
      // The file may contain ESM syntax with no ESM marker (.mjs /
      // "type":"module") — try loading as native ESM. If the ESM parser also
      // rejects it, the original CJS error was the genuine one; surface it
      // instead of the (less useful) ESM diagnostic.
      const cjsSyntaxError = error as Error;
      return this.loadEsmModule(modulePath).catch(esmError => {
        throw isError(esmError) && esmError.name === 'SyntaxError'
          ? cjsSyntaxError
          : esmError;
      });
    }

    // Cache the promise so concurrent importers await the same link/evaluate
    // instead of grabbing the still-unlinked module out of the registry.
    const evaluated = evaluateSyntheticModule(synthetic);
    registry.set(modulePath, evaluated);
    return evaluated;
  }

  private async importMock<T = unknown>(
    from: string,
    moduleName: string,
    context: VMContext,
  ): Promise<T> {
    const moduleID = await this._resolver.getModuleIDAsync(
      this._virtualModuleMocks,
      from,
      moduleName,
      {conditions: this.esmConditions},
    );

    if (this._moduleMockRegistry.has(moduleID)) {
      return this._moduleMockRegistry.get(moduleID) as T;
    }

    if (this._moduleMockFactories.has(moduleID)) {
      const invokedFactory: any = await this._moduleMockFactories.get(
        moduleID,
        // has check above makes this ok
      )!();

      const module = new SyntheticModule(
        Object.keys(invokedFactory),
        function () {
          for (const [key, value] of Object.entries(invokedFactory)) {
            this.setExport(key, value);
          }
        },
        {context, identifier: moduleName},
      );

      this._moduleMockRegistry.set(moduleID, module);

      return evaluateSyntheticModule(module) as T;
    }

    throw new Error('Attempting to import a mock without a factory');
  }

  private getExportsOfCjs(modulePath: string) {
    const cachedNamedExports = this._cjsNamedExports.get(modulePath);

    if (cachedNamedExports) {
      return cachedNamedExports;
    }

    if (path.extname(modulePath) === '.node') {
      const nativeModule = this.requireModuleOrMock('', modulePath);

      const namedExports = new Set(
        Object.keys(nativeModule as Record<string, unknown>),
      );

      this._cjsNamedExports.set(modulePath, namedExports);

      return namedExports;
    }

    const transformedCode =
      this._fileTransforms.get(modulePath)?.code ?? this.readFile(modulePath);

    const {exports, reexports} = parseCjs(transformedCode);

    const namedExports = new Set(exports);

    for (const reexport of reexports) {
      if (this._resolver.isCoreModule(reexport)) {
        const exports = this.requireModule(modulePath, reexport);
        if (exports !== null && typeof exports === 'object') {
          for (const e of Object.keys(exports as Record<string, unknown>))
            namedExports.add(e);
        }
      } else {
        const resolved = this._resolveCjsModule(modulePath, reexport);

        const exports = this.getExportsOfCjs(resolved);

        for (const e of exports) namedExports.add(e);
      }
    }

    this._cjsNamedExports.set(modulePath, namedExports);

    return namedExports;
  }

  requireModule<T = unknown>(
    from: string,
    moduleName?: string,
    options?: InternalModuleOptions,
    isRequireActual = false,
  ): T {
    const isInternal = options?.isInternalModule ?? false;
    const resolveModuleOptions = {conditions: this.cjsConditions};
    const moduleID = this._resolver.getModuleID(
      this._virtualMocks,
      from,
      moduleName,
      resolveModuleOptions,
    );
    let modulePath: string | undefined;

    // Some old tests rely on this mocking behavior. Ideally we'll change this
    // to be more explicit.
    const moduleResource = moduleName && this._resolver.getModule(moduleName);
    const manualMock =
      moduleName &&
      this._resolver.getMockModule(from, moduleName, resolveModuleOptions);
    if (
      !options?.isInternalModule &&
      !isRequireActual &&
      !moduleResource &&
      manualMock &&
      manualMock !== this._isCurrentlyExecutingManualMock &&
      this._explicitShouldMock.get(moduleID) !== false
    ) {
      modulePath = manualMock;
    }

    if (moduleName && this._resolver.isCoreModule(moduleName)) {
      return this._requireCoreModule(
        moduleName,
        supportsNodeColonModulePrefixInRequire,
      );
    }

    if (!modulePath) {
      modulePath = this._resolveCjsModule(from, moduleName);
    }

    if (this.unstable_shouldLoadAsEsm(modulePath)) {
      // Node includes more info in the message
      const error: NodeJS.ErrnoException = new Error(
        `Must use import to load ES Module: ${modulePath}`,
      );
      error.code = 'ERR_REQUIRE_ESM';
      throw error;
    }

    let moduleRegistry;

    if (isInternal) {
      moduleRegistry = this._internalModuleRegistry;
    } else if (this._isolatedModuleRegistry) {
      moduleRegistry = this._isolatedModuleRegistry;
    } else {
      moduleRegistry = this._moduleRegistry;
    }

    const module = moduleRegistry.get(modulePath);
    if (module) {
      return (module as Module).exports;
    }

    // We must register the pre-allocated module object first so that any
    // circular dependencies that may arise while evaluating the module can
    // be satisfied.
    const localModule: InitialModule = {
      children: [],
      exports: {},
      filename: modulePath,
      id: modulePath,
      isPreloading: false,
      loaded: false,
      path: path.dirname(modulePath),
    };
    moduleRegistry.set(modulePath, localModule);

    try {
      this._loadModule(
        localModule,
        from,
        moduleName,
        modulePath,
        options,
        moduleRegistry,
      );
    } catch (error) {
      moduleRegistry.delete(modulePath);
      throw error;
    }

    return localModule.exports;
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
      supportsDynamicImport: esmIsAvailable,
      supportsExportNamespaceFrom: false,
      supportsStaticESM: false,
      supportsTopLevelAwait: false,
    });
  }

  requireActual<T = unknown>(from: string, moduleName: string): T {
    return this.requireModule<T>(from, moduleName, undefined, true);
  }

  requireMock<T = unknown>(from: string, moduleName: string): T {
    const options = {conditions: this.cjsConditions};
    const moduleID = this._resolver.getModuleID(
      this._virtualMocks,
      from,
      moduleName,
      options,
    );

    if (this._isolatedMockRegistry?.has(moduleID)) {
      return this._isolatedMockRegistry.get(moduleID);
    } else if (this._mockRegistry.has(moduleID)) {
      return this._mockRegistry.get(moduleID);
    }

    const mockRegistry = this._isolatedMockRegistry || this._mockRegistry;

    if (this._mockFactories.has(moduleID)) {
      // has check above makes this ok
      const module = this._mockFactories.get(moduleID)!();
      mockRegistry.set(moduleID, module);
      return module as T;
    }

    /** Resolved mock module path from (potentially aliased) module name. */
    const manualMockPath: string | null = (() => {
      // Attempt to get manual mock path when moduleName is a:

      // A. Core module specifier i.e. ['fs', 'node:fs']:
      // Normalize then check for a root manual mock '<rootDir>/__mocks__/'
      if (this._resolver.isCoreModule(moduleName)) {
        const moduleWithoutNodePrefix =
          this._resolver.normalizeCoreModuleSpecifier(moduleName);
        return this._resolver.getMockModule(
          from,
          moduleWithoutNodePrefix,
          options,
        );
      }

      // B. Node module specifier i.e. ['jest', 'react']:
      // Look for root manual mock
      const rootMock = this._resolver.getMockModule(from, moduleName, options);
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
      const modulePath = this._resolveCjsModule(from, moduleName);
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

      this._loadModule(
        localModule,
        from,
        moduleName,
        manualMockPath,
        undefined,
        mockRegistry,
      );

      mockRegistry.set(moduleID, localModule.exports);
    } else {
      // Look for a real module to generate an automock from
      mockRegistry.set(moduleID, this._generateMock(from, moduleName));
    }

    return mockRegistry.get(moduleID);
  }

  private _loadModule(
    localModule: InitialModule,
    from: string,
    moduleName: string | undefined,
    modulePath: string,
    options: InternalModuleOptions | undefined,
    moduleRegistry: ModuleRegistry,
  ) {
    if (path.extname(modulePath) === '.json') {
      const text = stripBOM(this.readFile(modulePath));

      const transformedFile = this._scriptTransformer.transformJson(
        modulePath,
        this._getFullTransformationOptions(options),
        text,
      );

      localModule.exports =
        this._environment.global.JSON.parse(transformedFile);
    } else if (path.extname(modulePath) === '.node') {
      localModule.exports = require(modulePath);
    } else {
      // Only include the fromPath if a moduleName is given. Else treat as root.
      const fromPath = moduleName ? from : null;
      this._execModule(
        localModule,
        options,
        moduleRegistry,
        fromPath,
        moduleName,
      );
    }
    localModule.loaded = true;
  }

  private _getFullTransformationOptions(
    options: InternalModuleOptions = defaultTransformOptions,
  ): TransformationOptions {
    return {...options, ...this._coverageOptions};
  }

  requireModuleOrMock<T = unknown>(from: string, moduleName: string): T {
    // this module is unmockable
    if (moduleName === '@jest/globals') {
      // @ts-expect-error: we don't care that it's not assignable to T
      return this.getGlobalsForCjs(from);
    }

    try {
      if (this._shouldMockCjs(from, moduleName, this._explicitShouldMock)) {
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
    if (this._isolatedModuleRegistry || this._isolatedMockRegistry) {
      throw new Error(
        'isolateModules cannot be nested inside another isolateModules or isolateModulesAsync.',
      );
    }
    this._isolatedModuleRegistry = new Map();
    this._isolatedMockRegistry = new Map();
    try {
      fn();
    } finally {
      // might be cleared within the callback
      this._isolatedModuleRegistry?.clear();
      this._isolatedMockRegistry?.clear();
      this._isolatedModuleRegistry = null;
      this._isolatedMockRegistry = null;
    }
  }

  async isolateModulesAsync(fn: () => Promise<void>): Promise<void> {
    if (this._isolatedModuleRegistry || this._isolatedMockRegistry) {
      throw new Error(
        'isolateModulesAsync cannot be nested inside another isolateModulesAsync or isolateModules.',
      );
    }
    this._isolatedModuleRegistry = new Map();
    this._isolatedMockRegistry = new Map();
    try {
      await fn();
    } finally {
      // might be cleared within the callback
      this._isolatedModuleRegistry?.clear();
      this._isolatedMockRegistry?.clear();
      this._isolatedModuleRegistry = null;
      this._isolatedMockRegistry = null;
    }
  }

  resetModules(): void {
    this._isolatedModuleRegistry?.clear();
    this._isolatedMockRegistry?.clear();
    this._isolatedModuleRegistry = null;
    this._isolatedMockRegistry = null;
    this._mockRegistry.clear();
    this._moduleRegistry.clear();
    this._esmoduleRegistry.clear();
    this._fileTransformsMutex.clear();
    this._cjsNamedExports.clear();
    this._moduleMockRegistry.clear();
    this._cacheFS.clear();
    this._cacheFSBuffer.clear();

    if (
      this._coverageOptions.collectCoverage &&
      this._coverageOptions.coverageProvider === 'v8' &&
      this._v8CoverageSources
    ) {
      this._v8CoverageSources = new Map([
        ...this._v8CoverageSources,
        ...this._fileTransforms,
      ]);
    }

    this._fileTransforms.clear();

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

  async collectV8Coverage(): Promise<void> {
    this._v8CoverageInstrumenter = new CoverageInstrumenter();
    this._v8CoverageSources = new Map();

    await this._v8CoverageInstrumenter.startInstrumenting();
  }

  async stopCollectingV8Coverage(): Promise<void> {
    if (!this._v8CoverageInstrumenter || !this._v8CoverageSources) {
      throw new Error('You need to call `collectV8Coverage` first.');
    }
    this._v8CoverageResult =
      await this._v8CoverageInstrumenter.stopInstrumenting();
    this._v8CoverageSources = new Map([
      ...this._v8CoverageSources,
      ...this._fileTransforms,
    ]);
  }

  getAllCoverageInfoCopy(): JestEnvironment['global']['__coverage__'] {
    return deepCyclicCopy(this._environment.global.__coverage__);
  }

  getAllV8CoverageInfoCopy(): V8CoverageResult {
    if (!this._v8CoverageResult || !this._v8CoverageSources) {
      throw new Error('You need to call `stopCollectingV8Coverage` first.');
    }

    return this._v8CoverageResult
      .filter(res => res.url.startsWith('file://'))
      .map(res => ({...res, url: fileURLToPath(res.url)}))
      .filter(
        res =>
          // TODO: will this work on windows? It might be better if `shouldInstrument` deals with it anyways
          res.url.startsWith(this._config.rootDir) &&
          shouldInstrument(
            res.url,
            this._coverageOptions,
            this._config,
            /* loadedFilenames */ [...this._v8CoverageSources!.keys()],
          ),
      )
      .map(result => {
        const transformedFile = this._v8CoverageSources!.get(result.url);

        return {codeTransformResult: transformedFile, result};
      });
  }

  getSourceMaps(): SourceMapRegistry {
    return this._sourceMapRegistry;
  }

  setMock(
    from: string,
    moduleName: string,
    mockFactory: () => unknown,
    options?: {virtual?: boolean},
  ): void {
    if (options?.virtual) {
      const mockPath = this._resolver.getModulePath(from, moduleName);

      this._virtualMocks.set(mockPath, true);
    }
    const moduleID = this._resolver.getModuleID(
      this._virtualMocks,
      from,
      moduleName,
      {conditions: this.cjsConditions},
    );
    this._explicitShouldMock.set(moduleID, true);
    this._mockFactories.set(moduleID, mockFactory);
  }

  private setModuleMock(
    from: string,
    moduleName: string,
    mockFactory: () => Promise<unknown> | unknown,
    options?: {virtual?: boolean},
  ): void {
    if (options?.virtual) {
      const mockPath = this._resolver.getModulePath(from, moduleName);

      this._virtualModuleMocks.set(mockPath, true);
    }
    const moduleID = this._resolver.getModuleID(
      this._virtualModuleMocks,
      from,
      moduleName,
      {conditions: this.esmConditions},
    );
    this._explicitShouldMockModule.set(moduleID, true);
    this._moduleMockFactories.set(moduleID, mockFactory);
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
    this.isInsideTestCode = true;
  }

  leaveTestCode(): void {
    this.isInsideTestCode = false;
  }

  teardown(): void {
    this.restoreAllMocks();
    this.resetModules();

    this._internalModuleRegistry.clear();
    this._mainModule = null;
    this._mockFactories.clear();
    this._moduleMockFactories.clear();
    this._mockMetaDataCache.clear();
    this._shouldMockModuleCache.clear();
    this._shouldUnmockTransitiveDependenciesCache.clear();
    this._explicitShouldMock.clear();
    this._explicitShouldMockModule.clear();
    this._transitiveShouldMock.clear();
    this._virtualMocks.clear();
    this._virtualModuleMocks.clear();
    this._cacheFS.clear();
    this._unmockList = undefined;

    this._sourceMapRegistry.clear();

    this._fileTransforms.clear();
    this.jestObjectCaches.clear();

    this._v8CoverageSources?.clear();
    this._v8CoverageResult = [];
    this._v8CoverageInstrumenter = undefined;
    this._moduleImplementation = undefined;

    this.isTornDown = true;
  }

  private _resolveCjsModule(from: string, to: string | undefined) {
    return to
      ? this._resolver.resolveModule(from, to, {conditions: this.cjsConditions})
      : from;
  }

  private _resolveModule(from: string, to: string | undefined) {
    return to
      ? this._resolver.resolveModuleAsync(from, to, {
          conditions: this.esmConditions,
        })
      : from;
  }

  private _requireResolve(
    from: string,
    moduleName?: string,
    options: ResolveOptions = {},
  ) {
    if (moduleName == null) {
      throw new Error(
        'The first argument to require.resolve must be a string. Received null or undefined.',
      );
    }

    if (path.isAbsolute(moduleName)) {
      const module = this._resolver.resolveModuleFromDirIfExists(
        moduleName,
        moduleName,
        {conditions: this.cjsConditions, paths: []},
      );
      if (module) {
        return module;
      }
    } else if (options.paths) {
      for (const p of options.paths) {
        const absolutePath = path.resolve(from, '..', p);
        const module = this._resolver.resolveModuleFromDirIfExists(
          absolutePath,
          moduleName,
          // required to also resolve files without leading './' directly in the path
          {conditions: this.cjsConditions, paths: [absolutePath]},
        );
        if (module) {
          return module;
        }
      }

      throw new Resolver.ModuleNotFoundError(
        `Cannot resolve module '${moduleName}' from paths ['${options.paths.join(
          "', '",
        )}'] from ${from}`,
      );
    }

    try {
      return this._resolveCjsModule(from, moduleName);
    } catch (error) {
      const module = this._resolver.getMockModule(from, moduleName, {
        conditions: this.cjsConditions,
      });

      if (module) {
        return module;
      } else {
        throw error;
      }
    }
  }

  private _requireResolvePaths(from: string, moduleName?: string) {
    const fromDir = path.resolve(from, '..');
    if (moduleName == null) {
      throw new Error(
        'The first argument to require.resolve.paths must be a string. Received null or undefined.',
      );
    }
    if (moduleName.length === 0) {
      throw new Error(
        'The first argument to require.resolve.paths must not be the empty string.',
      );
    }

    if (moduleName[0] === '.') {
      return [fromDir];
    }
    if (this._resolver.isCoreModule(moduleName)) {
      return null;
    }
    const modulePaths = this._resolver.getModulePaths(fromDir);
    const globalPaths = this._resolver.getGlobalPaths(moduleName);
    return [...modulePaths, ...globalPaths];
  }

  private _execModule(
    localModule: InitialModule,
    options: InternalModuleOptions | undefined,
    moduleRegistry: ModuleRegistry,
    from: string | null,
    moduleName?: string,
  ) {
    if (this.isTornDown) {
      this._logFormattedReferenceError(
        'You are trying to `import` a file after the Jest environment has been torn down.',
      );
      process.exitCode = 1;
      return;
    }
    if (this.isInsideTestCode === false && !supportsDynamicImport) {
      throw new ReferenceError(
        'You are trying to `import` a file outside of the scope of the test code.',
      );
    }

    // If the environment was disposed, prevent this module from being executed.
    if (!this._environment.global) {
      return;
    }

    const module = localModule as Module;

    const filename = module.filename;
    const lastExecutingModulePath = this._currentlyExecutingModulePath;
    this._currentlyExecutingModulePath = filename;
    const origCurrExecutingManualMock = this._isCurrentlyExecutingManualMock;
    this._isCurrentlyExecutingManualMock = filename;

    module.children = [];

    Object.defineProperty(module, 'parent', {
      enumerable: true,
      get() {
        const key = from || '';
        return moduleRegistry.get(key) || null;
      },
    });
    const modulePaths = this._resolver.getModulePaths(module.path);
    const globalPaths = this._resolver.getGlobalPaths(moduleName);
    module.paths = [...modulePaths, ...globalPaths];

    Object.defineProperty(module, 'require', {
      value: this._createRequireImplementation(module, options),
    });

    const transformedCode = this.transformFile(filename, options);

    const compiledFunction = this.createScriptFromCode(
      transformedCode,
      filename,
    );

    if (compiledFunction === null) {
      this._logFormattedReferenceError(
        'You are trying to `import` a file after the Jest environment has been torn down.',
      );
      process.exitCode = 1;
      return;
    }

    const jestObject = this._createJestObjectFor(filename);

    this.jestObjectCaches.set(filename, jestObject);

    const lastArgs: [Jest | undefined, ...Array<Global.Global>] = [
      this._config.injectGlobals ? jestObject : undefined, // jest object
      ...this._config.sandboxInjectedGlobals.map<Global.Global>(
        globalVariable => {
          if (this._environment.global[globalVariable]) {
            return this._environment.global[globalVariable];
          }

          throw new Error(
            `You have requested '${globalVariable}' as a global variable, but it was not present. Please check your config or your global environment.`,
          );
        },
      ),
    ];

    if (!this._mainModule && filename === this._testPath) {
      this._mainModule = module;
    }

    Object.defineProperty(module, 'main', {
      enumerable: true,
      value: this._mainModule,
    });

    try {
      compiledFunction.call(
        module.exports,
        module, // module object
        module.exports, // module exports
        module.require, // require implementation
        module.path, // __dirname
        module.filename, // __filename
        lastArgs[0],
        ...lastArgs.slice(1).filter(isNonNullable),
      );
    } catch (error: any) {
      this.handleExecutionError(error, module);
    }

    this._isCurrentlyExecutingManualMock = origCurrExecutingManualMock;
    this._currentlyExecutingModulePath = lastExecutingModulePath;
  }

  private transformFile(
    filename: string,
    options?: InternalModuleOptions,
  ): string {
    const source = this.readFile(filename);

    if (options?.isInternalModule) {
      return source;
    }

    const transformedFile = this._scriptTransformer.transform(
      filename,
      this._getFullTransformationOptions(options),
      source,
    );

    this._fileTransforms.set(filename, transformedFile);

    if (transformedFile.sourceMapPath) {
      this._sourceMapRegistry.set(filename, transformedFile.sourceMapPath);
    }
    return transformedFile.code;
  }

  private async transformFileAsync(
    filename: string,
    options?: InternalModuleOptions,
  ): Promise<string> {
    const source = this.readFile(filename);

    if (options?.isInternalModule) {
      return source;
    }

    const transformedFile = await this._scriptTransformer.transformAsync(
      filename,
      this._getFullTransformationOptions(options),
      source,
    );

    if (this._fileTransforms.get(filename)?.code !== transformedFile.code) {
      this._fileTransforms.set(filename, transformedFile);
    }

    if (transformedFile.sourceMapPath) {
      this._sourceMapRegistry.set(filename, transformedFile.sourceMapPath);
    }
    return transformedFile.code;
  }

  private createScriptFromCode(scriptSource: string, filename: string) {
    const vmContext = this._environment.getVmContext();

    if (vmContext == null) {
      return null;
    }

    try {
      const scriptFilename = this._resolver.isCoreModule(filename)
        ? `jest-nodejs-core-${filename}`
        : filename;
      return compileFunction(
        scriptSource,
        this.constructInjectedModuleParameters(),
        {
          filename: scriptFilename,
          importModuleDynamically: async specifier => {
            invariant(
              runtimeSupportsVmModules,
              'You need to run with a version of node that supports ES Modules in the VM API. See https://jestjs.io/docs/ecmascript-modules',
            );

            const module = await this.resolveModule<VMModule>(
              specifier,
              scriptFilename,
              vmContext,
            );

            return this.linkAndEvaluateModule(module);
          },
          parsingContext: vmContext,
        },
      ) as ModuleWrapper;
    } catch (error: any) {
      throw handlePotentialSyntaxError(error);
    }
  }

  private _requireCoreModule(moduleName: string, supportPrefix: boolean) {
    const moduleWithoutNodePrefix =
      supportPrefix && this._resolver.normalizeCoreModuleSpecifier(moduleName);

    if (moduleWithoutNodePrefix === 'process') {
      return this._environment.global.process;
    }

    if (moduleWithoutNodePrefix === 'module') {
      return this._getMockedNativeModule();
    }

    const coreModule = require(moduleName);
    protectProperties(coreModule);
    return coreModule;
  }

  private _buildCoreSyntheticModule(
    moduleName: string,
    context: VMContext,
  ): SyntheticModule {
    const required = this._requireCoreModule(moduleName, true);
    const allExports = Object.entries(required);
    const exportNames = allExports.map(([key]) => key);

    return new SyntheticModule(
      ['default', ...exportNames],
      function () {
        this.setExport('default', required);
        for (const [key, value] of allExports) {
          this.setExport(key, value);
        }
      },
      // should identifier be `node://${moduleName}`?
      {context, identifier: moduleName},
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
        // returns — deadlock. The SyntheticModule's evaluate function below
        // accesses namespace only after Node has fully evaluated all deps in
        // topological order, so the module will be ready by then.
        moduleLookup[module] = resolvedModule;
      }
    }
    return this._buildWasmSyntheticModule(
      wasmModule,
      identifier,
      context,
      depSpec => moduleLookup[depSpec].namespace as Record<string, unknown>,
    );
  }

  private _getMockedNativeModule(): typeof nativeModule.Module {
    if (this._moduleImplementation) {
      return this._moduleImplementation;
    }

    const createRequire = (modulePath: string | URL) => {
      const filename =
        typeof modulePath === 'string'
          ? modulePath.startsWith('file:///')
            ? fileURLToPath(new URL(modulePath))
            : modulePath
          : fileURLToPath(modulePath);

      if (!path.isAbsolute(filename)) {
        const error: NodeJS.ErrnoException = new TypeError(
          `The argument 'filename' must be a file URL object, file URL string, or absolute path string. Received '${filename}'`,
        );
        error.code = 'ERR_INVALID_ARG_TYPE';
        throw error;
      }

      return this._createRequireImplementation({
        children: [],
        exports: {},
        filename,
        id: filename,
        isPreloading: false,
        loaded: false,
        path: path.dirname(filename),
      });
    };

    // should we implement the class ourselves?
    class Module extends nativeModule.Module {}

    for (const [key, value] of Object.entries(nativeModule.Module)) {
      // @ts-expect-error: no index signature
      Module[key] = value;
    }

    Module.Module = Module;

    if ('createRequire' in nativeModule) {
      Module.createRequire = createRequire;
    }
    if ('syncBuiltinESMExports' in nativeModule) {
      // cast since TS seems very confused about whether it exists or not
      (Module as any).syncBuiltinESMExports =
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        function syncBuiltinESMExports() {};
    }

    this._moduleImplementation = Module;

    return Module;
  }

  private _generateMock<T>(from: string, moduleName: string) {
    const modulePath =
      this._resolver.resolveStubModuleName(from, moduleName, {
        conditions: this.cjsConditions,
      }) || this._resolveCjsModule(from, moduleName);
    if (!this._mockMetaDataCache.has(modulePath)) {
      // This allows us to handle circular dependencies while generating an
      // automock

      this._mockMetaDataCache.set(
        modulePath,
        this._moduleMocker.getMetadata({}) || {},
      );

      // In order to avoid it being possible for automocking to potentially
      // cause side-effects within the module environment, we need to execute
      // the module in isolation. This could cause issues if the module being
      // mocked has calls into side-effectful APIs on another module.
      const origMockRegistry = this._mockRegistry;
      const origModuleRegistry = this._moduleRegistry;
      this._mockRegistry = new Map();
      this._moduleRegistry = new Map();

      const moduleExports = this.requireModule(from, moduleName);

      // Restore the "real" module/mock registries
      this._mockRegistry = origMockRegistry;
      this._moduleRegistry = origModuleRegistry;

      const mockMetadata = this._moduleMocker.getMetadata(moduleExports);
      if (mockMetadata == null) {
        throw new Error(
          `Failed to get mock metadata: ${modulePath}\n\n` +
            'See: https://jestjs.io/docs/manual-mocks#content',
        );
      }
      this._mockMetaDataCache.set(modulePath, mockMetadata);
    }
    let moduleMock = this._moduleMocker.generateFromMetadata<T>(
      // added above if missing
      this._mockMetaDataCache.get(modulePath)!,
    );

    for (const onGenerateMock of this._onGenerateMock) {
      moduleMock = onGenerateMock(modulePath, moduleMock);
    }

    return moduleMock;
  }

  private _shouldMockCjs(
    from: string,
    moduleName: string,
    explicitShouldMock: Map<string, boolean>,
  ): boolean {
    const options: ResolveModuleConfig = {conditions: this.cjsConditions};
    const moduleID = this._resolver.getModuleID(
      this._virtualMocks,
      from,
      moduleName,
      options,
    );
    const key = from + path.delimiter + moduleID;

    if (explicitShouldMock.has(moduleID)) {
      // guaranteed by `has` above
      return explicitShouldMock.get(moduleID)!;
    }

    if (
      !this._shouldAutoMock ||
      this._resolver.isCoreModule(moduleName) ||
      this._shouldUnmockTransitiveDependenciesCache.get(key)
    ) {
      return false;
    }

    if (this._shouldMockModuleCache.has(moduleID)) {
      // guaranteed by `has` above
      return this._shouldMockModuleCache.get(moduleID)!;
    }

    let modulePath;
    try {
      modulePath = this._resolveCjsModule(from, moduleName);
    } catch (error) {
      const manualMock = this._resolver.getMockModule(
        from,
        moduleName,
        options,
      );
      if (manualMock) {
        this._shouldMockModuleCache.set(moduleID, true);
        return true;
      }
      throw error;
    }

    if (this._unmockList && this._unmockList.test(modulePath)) {
      this._shouldMockModuleCache.set(moduleID, false);
      return false;
    }

    // transitive unmocking for package managers that store flat packages (npm3)
    const currentModuleID = this._resolver.getModuleID(
      this._virtualMocks,
      from,
      undefined,
      options,
    );
    if (
      this._transitiveShouldMock.get(currentModuleID) === false ||
      (from.includes(NODE_MODULES) &&
        modulePath.includes(NODE_MODULES) &&
        ((this._unmockList && this._unmockList.test(from)) ||
          explicitShouldMock.get(currentModuleID) === false))
    ) {
      this._transitiveShouldMock.set(moduleID, false);
      this._shouldUnmockTransitiveDependenciesCache.set(key, true);
      return false;
    }
    this._shouldMockModuleCache.set(moduleID, true);
    return true;
  }

  private _resolveModuleSync(from: string, to: string | undefined): string {
    return to
      ? this._resolver.resolveModule(from, to, {
          conditions: this.esmConditions,
        })
      : from;
  }

  // Sync mirror of `_shouldMockModule`. Used by the sync-first ESM core on
  // Node v24.9+. Logic must stay in lockstep with the async version.
  private _shouldMockModuleSync(
    from: string,
    moduleName: string,
    explicitShouldMock: Map<string, boolean>,
  ): boolean {
    const options: ResolveModuleConfig = {conditions: this.esmConditions};
    const moduleID = this._resolver.getModuleID(
      this._virtualMocks,
      from,
      moduleName,
      options,
    );
    const key = from + path.delimiter + moduleID;

    if (explicitShouldMock.has(moduleID)) {
      return explicitShouldMock.get(moduleID)!;
    }

    if (
      !this._shouldAutoMock ||
      this._resolver.isCoreModule(moduleName) ||
      this._shouldUnmockTransitiveDependenciesCache.get(key)
    ) {
      return false;
    }

    if (this._shouldMockModuleCache.has(moduleID)) {
      return this._shouldMockModuleCache.get(moduleID)!;
    }

    let modulePath;
    try {
      modulePath = this._resolveModuleSync(from, moduleName);
    } catch (error) {
      const manualMock = this._resolver.getMockModule(
        from,
        moduleName,
        options,
      );
      if (manualMock) {
        this._shouldMockModuleCache.set(moduleID, true);
        return true;
      }
      throw error;
    }

    if (this._unmockList && this._unmockList.test(modulePath)) {
      this._shouldMockModuleCache.set(moduleID, false);
      return false;
    }

    const currentModuleID = this._resolver.getModuleID(
      this._virtualMocks,
      from,
      undefined,
      options,
    );
    if (
      this._transitiveShouldMock.get(currentModuleID) === false ||
      (from.includes(NODE_MODULES) &&
        modulePath.includes(NODE_MODULES) &&
        ((this._unmockList && this._unmockList.test(from)) ||
          explicitShouldMock.get(currentModuleID) === false))
    ) {
      this._transitiveShouldMock.set(moduleID, false);
      this._shouldUnmockTransitiveDependenciesCache.set(key, true);
      return false;
    }
    this._shouldMockModuleCache.set(moduleID, true);
    return true;
  }

  private async _shouldMockModule(
    from: string,
    moduleName: string,
    explicitShouldMock: Map<string, boolean>,
  ): Promise<boolean> {
    const options: ResolveModuleConfig = {conditions: this.esmConditions};
    const moduleID = await this._resolver.getModuleIDAsync(
      this._virtualMocks,
      from,
      moduleName,
      options,
    );
    const key = from + path.delimiter + moduleID;

    if (explicitShouldMock.has(moduleID)) {
      // guaranteed by `has` above
      return explicitShouldMock.get(moduleID)!;
    }

    if (
      !this._shouldAutoMock ||
      this._resolver.isCoreModule(moduleName) ||
      this._shouldUnmockTransitiveDependenciesCache.get(key)
    ) {
      return false;
    }

    if (this._shouldMockModuleCache.has(moduleID)) {
      // guaranteed by `has` above
      return this._shouldMockModuleCache.get(moduleID)!;
    }

    let modulePath;
    try {
      modulePath = await this._resolveModule(from, moduleName);
    } catch (error) {
      const manualMock = await this._resolver.getMockModuleAsync(
        from,
        moduleName,
        options,
      );
      if (manualMock) {
        this._shouldMockModuleCache.set(moduleID, true);
        return true;
      }
      throw error;
    }

    if (this._unmockList && this._unmockList.test(modulePath)) {
      this._shouldMockModuleCache.set(moduleID, false);
      return false;
    }

    // transitive unmocking for package managers that store flat packages (npm3)
    const currentModuleID = await this._resolver.getModuleIDAsync(
      this._virtualMocks,
      from,
      undefined,
      options,
    );
    if (
      this._transitiveShouldMock.get(currentModuleID) === false ||
      (from.includes(NODE_MODULES) &&
        modulePath.includes(NODE_MODULES) &&
        ((this._unmockList && this._unmockList.test(from)) ||
          explicitShouldMock.get(currentModuleID) === false))
    ) {
      this._transitiveShouldMock.set(moduleID, false);
      this._shouldUnmockTransitiveDependenciesCache.set(key, true);
      return false;
    }
    this._shouldMockModuleCache.set(moduleID, true);
    return true;
  }

  private _createRequireImplementation(
    from: InitialModule,
    options?: InternalModuleOptions,
  ): NodeJS.Require {
    const resolve = (moduleName: string, resolveOptions?: ResolveOptions) => {
      const resolved = this._requireResolve(
        from.filename,
        moduleName,
        resolveOptions,
      );
      if (
        resolveOptions?.[JEST_RESOLVE_OUTSIDE_VM_OPTION] &&
        options?.isInternalModule
      ) {
        return createOutsideJestVmPath(resolved);
      }
      return resolved;
    };
    resolve.paths = (moduleName: string) =>
      this._requireResolvePaths(from.filename, moduleName);

    const moduleRequire = (
      options?.isInternalModule
        ? (moduleName: string) =>
            this.requireInternalModule(from.filename, moduleName)
        : this.requireModuleOrMock.bind(this, from.filename)
    ) as NodeJS.Require;
    moduleRequire.extensions = Object.create(null);
    moduleRequire.resolve = resolve;
    moduleRequire.cache = (() => {
      // TODO: consider warning somehow that this does nothing. We should support deletions, anyways
      const notPermittedMethod = () => true;
      return new Proxy<(typeof moduleRequire)['cache']>(Object.create(null), {
        defineProperty: notPermittedMethod,
        deleteProperty: notPermittedMethod,
        get: (_target, key) =>
          typeof key === 'string' ? this._moduleRegistry.get(key) : undefined,
        getOwnPropertyDescriptor() {
          return {configurable: true, enumerable: true};
        },
        has: (_target, key) =>
          typeof key === 'string' && this._moduleRegistry.has(key),
        ownKeys: () => [...this._moduleRegistry.keys()],
        set: notPermittedMethod,
      });
    })();

    Object.defineProperty(moduleRequire, 'main', {
      enumerable: true,
      value: this._mainModule,
    });

    return moduleRequire;
  }

  private _createJestObjectFor(from: string): Jest {
    const disableAutomock = () => {
      this._shouldAutoMock = false;
      return jestObject;
    };
    const enableAutomock = () => {
      this._shouldAutoMock = true;
      return jestObject;
    };
    const unmock = (moduleName: string) => {
      const moduleID = this._resolver.getModuleID(
        this._virtualMocks,
        from,
        moduleName,
        {conditions: this.cjsConditions},
      );
      this._explicitShouldMock.set(moduleID, false);
      return jestObject;
    };
    const unmockModule = (moduleName: string) => {
      const moduleID = this._resolver.getModuleID(
        this._virtualModuleMocks,
        from,
        moduleName,
        {conditions: this.esmConditions},
      );
      this._explicitShouldMockModule.set(moduleID, false);
      return jestObject;
    };
    const deepUnmock = (moduleName: string) => {
      const moduleID = this._resolver.getModuleID(
        this._virtualMocks,
        from,
        moduleName,
        {conditions: this.cjsConditions},
      );
      this._explicitShouldMock.set(moduleID, false);
      this._transitiveShouldMock.set(moduleID, false);
      return jestObject;
    };
    const mock: Jest['mock'] = (moduleName, mockFactory, options) => {
      if (mockFactory !== undefined) {
        return setMockFactory(moduleName, mockFactory, options);
      }

      const moduleID = this._resolver.getModuleID(
        this._virtualMocks,
        from,
        moduleName,
        {conditions: this.cjsConditions},
      );
      this._explicitShouldMock.set(moduleID, true);
      return jestObject;
    };
    const onGenerateMock: Jest['onGenerateMock'] = <T>(
      cb: (moduleName: string, moduleMock: T) => T,
    ) => {
      this._onGenerateMock.add(cb);
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
        this.isTornDown ||
        !(this._environment.fakeTimers || this._environment.fakeTimersModern)
      ) {
        this._logFormattedReferenceError(
          'You are trying to access a property or method of the Jest environment after it has been torn down.',
        );
        process.exitCode = 1;
      }
      if (this.isInsideTestCode === false) {
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
      isEnvironmentTornDown: () => this.isTornDown,
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

  private constructInjectedModuleParameters(): Array<string> {
    return [
      'module',
      'exports',
      'require',
      '__dirname',
      '__filename',
      this._config.injectGlobals ? 'jest' : undefined,
      ...this._config.sandboxInjectedGlobals,
    ].filter(isNonNullable);
  }

  private handleExecutionError(e: Error, module: Module): never {
    const moduleNotFoundError = Resolver.tryCastModuleNotFoundError(e);
    if (moduleNotFoundError) {
      if (!moduleNotFoundError.requireStack) {
        moduleNotFoundError.requireStack = [module.filename || module.id];

        for (let cursor = module.parent; cursor; cursor = cursor.parent) {
          moduleNotFoundError.requireStack.push(cursor.filename || cursor.id);
        }

        moduleNotFoundError.buildMessage(this._config.rootDir);
      }
      throw moduleNotFoundError;
    }

    throw e;
  }

  private getGlobalsForCjs(from: string): JestGlobalsWithJest {
    const jest = this.jestObjectCaches.get(from);

    invariant(jest, 'There should always be a Jest object already');

    return {...this.getGlobalsFromEnvironment(), jest};
  }

  // Build a JSON SyntheticModule exposing the parsed value as the `default`
  // export. Returns it unevaluated; callers either evaluate it themselves
  // (legacy async path) or plug it into a parent's `linkRequests` and let the
  // root's evaluate cascade trigger it (sync path).
  private _buildJsonSyntheticModule(
    jsonText: string,
    identifier: string,
    context: VMContext,
  ): SyntheticModule {
    return new SyntheticModule(
      ['default'],
      function () {
        const obj = JSON.parse(jsonText);
        this.setExport('default', obj);
      },
      {context, identifier},
    );
  }

  // Build the wasm SyntheticModule. The body reads each import's namespace
  // via `getDepNamespace`, which both the sync graph (closure over `scratch`)
  // and the legacy path (closure over a pre-built `moduleLookup`) supply.
  private _buildWasmSyntheticModule(
    wasmModule: WebAssembly.Module,
    identifier: string,
    context: VMContext,
    getDepNamespace: (importModule: string) => Record<string, unknown>,
  ): SyntheticModule {
    const exports = WebAssembly.Module.exports(wasmModule);
    const imports = WebAssembly.Module.imports(wasmModule);

    return new SyntheticModule(
      exports.map(({name}) => name),
      function () {
        const importsObject: WebAssembly.Imports = {};
        for (const {module: depSpec, name} of imports) {
          if (!importsObject[depSpec]) {
            importsObject[depSpec] = {};
          }
          const namespace = getDepNamespace(depSpec);
          importsObject[depSpec][name] = namespace[name] as never;
        }
        const wasmInstance = new WebAssembly.Instance(
          wasmModule,
          importsObject,
        );
        for (const {name} of exports) {
          this.setExport(name, wasmInstance.exports[name]);
        }
      },
      {context, identifier},
    );
  }

  // Shared async dynamic-import callback: installed on every SourceTextModule
  // we construct (file, data: URI). Calls into resolveModule + linkAndEvaluate
  // — the dynamic import is async by language regardless of Node version.
  private _esmDynamicImport = async (
    specifier: string,
    referencingModule: VMModule,
  ): Promise<VMModule> => {
    invariant(
      runtimeSupportsVmModules,
      'You need to run with a version of node that supports ES Modules in the VM API. See https://jestjs.io/docs/ecmascript-modules',
    );
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
    let jest = this.jestObjectCaches.get(from);

    if (!jest) {
      jest = this._createJestObjectFor(from);

      this.jestObjectCaches.set(from, jest);
    }

    const globals: JestGlobalsWithJest = {
      ...this.getGlobalsFromEnvironment(),
      jest,
    };

    return new SyntheticModule(
      Object.keys(globals),
      function () {
        for (const [key, value] of Object.entries(globals)) {
          this.setExport(key, value);
        }
      },
      {context, identifier: '@jest/globals'},
    );
  }

  private getGlobalsForEsm(
    from: string,
    context: VMContext,
  ): Promise<VMModule> {
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

  private readFileBuffer(filename: string) {
    let source = this._cacheFSBuffer.get(filename);

    if (!source) {
      source = fs.readFileSync(filename);

      this._cacheFSBuffer.set(filename, source);
    }

    return source;
  }

  private readFile(filename: string): string {
    let source = this._cacheFS.get(filename);

    if (!source) {
      const buffer = this.readFileBuffer(filename);
      source = buffer.toString();

      this._cacheFS.set(filename, source);
    }

    return source;
  }

  setGlobalsForRuntime(globals: JestGlobals): void {
    this.jestGlobals = globals;
  }
}

async function evaluateSyntheticModule(module: SyntheticModule) {
  await module.link(() => {
    throw new Error('This should never happen');
  });

  await module.evaluate();

  return module;
}
