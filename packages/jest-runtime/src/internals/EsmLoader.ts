/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {
  SourceTextModule,
  type SyntheticModule,
  type Context as VMContext,
  type Module as VMModule,
} from 'node:vm';
import type {JestEnvironment, JestImportMeta} from '@jest/environment';
import {invariant, isPromise} from 'jest-util';
import {noop} from '../helpers';
import type {CjsExportsCache} from './CjsExportsCache';
import type {FileCache} from './FileCache';
import type {JestGlobals} from './JestGlobals';
import type {MockState} from './MockState';
import {CjsParseError} from './ModuleExecutor';
import type {ModuleRegistries} from './ModuleRegistries';
import {type Resolution, isWasm} from './Resolution';
import type {TestState} from './TestState';
import type {TransformCache, TransformOptions} from './TransformCache';
import type {CoreModuleProvider} from './cjsRequire';
import type {
  ESModule,
  ImportAttributes,
  JestModule,
  ModuleRegistry,
} from './moduleTypes';
import {
  runtimeSupportsVmModules,
  supportsSyncEvaluate,
} from './nodeCapabilities';
import {
  buildCjsAsEsmSyntheticModule,
  buildCoreSyntheticModule,
  buildJsonSyntheticModule,
  buildWasmSyntheticModule,
  evaluateSyntheticModule,
  syntheticFromExports,
} from './syntheticBuilders';

interface VMModuleWithAsyncGraph extends VMModule {
  hasAsyncGraph?: () => boolean;
  hasTopLevelAwait?: () => boolean;
  moduleRequests?: ReadonlyArray<{
    specifier: string;
    attributes: ImportAttributes;
    phase?: string;
  }>;
  linkRequests?: (deps: ReadonlyArray<VMModule>) => void;
  instantiate?: () => void;
}

// `'sync-required'` is `require(esm)` (must be loaded synchronously, throw a
// typed error on edges that would normally bail). `'sync-preferred'` is the
// fast path for `await import()` (try sync; fall back to the legacy async
// loader on any unsupported edge).
export type SyncEsmMode = 'sync-preferred' | 'sync-required';

// Returned by sync-graph methods when a dependency or condition prevents
// synchronous loading. Callers propagate it upward; the top-level
// `tryLoadGraphSync` caller falls back to the legacy async path.
export const LOAD_ASYNC = 'load-async' as const;
type LoadAsync = typeof LOAD_ASYNC;

type WorklistEntry = {
  cacheKey: string;
  modulePath: string;
};

type ResolvedSyncSpecifier = {
  cacheKey: string;
  enqueue: WorklistEntry | null;
  modulePath: string;
};

// Shape of the third arg Node passes to the `module.link` callback. TC39 final
// is `{attributes}`; legacy was `{assert}`. `@types/node@18` only types the
// legacy field, so we declare both ourselves.
// TODO(jest next major): drop `assert` once we require Node 22+.
type ModuleLinkExtra = {
  assert?: ImportAttributes;
  attributes?: ImportAttributes;
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
const dataURIRegex =
  /^data:(?<mime>text\/javascript|application\/json|application\/wasm)(?:;(?<encoding>charset=utf-8|base64))?,(?<code>.*)$/;

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

// Mirrors Node's `validateAttributes` in lib/internal/modules/esm/assert.js.
// The only deliberate divergence: missing `type: 'json'` warns instead of
// throwing — see the JSON branch below.
const warnedMissingJsonAttributePairs = new Set<string>();
// Soft cap so a long-lived process (watch mode, --runInBand) can't grow the
// set without bound. When we hit it we drop everything; users see at most one
// extra repeated warning per pair, which is benign.
const MAX_WARNED_PAIRS = 10_000;

function isJsonModule(modulePath: string): boolean {
  return (
    modulePath.endsWith('.json') ||
    modulePath.startsWith('data:application/json')
  );
}

// Avoid dumping the full payload of data: URIs (or other very long specifiers)
// into stderr.
function describeForWarning(modulePath: string): string {
  if (modulePath.startsWith('data:')) {
    const comma = modulePath.indexOf(',');
    if (comma > 0) return `${modulePath.slice(0, comma)},…`;
  }
  return modulePath;
}

function makeImportAttributeError(
  code:
    | 'ERR_IMPORT_ATTRIBUTE_UNSUPPORTED'
    | 'ERR_IMPORT_ATTRIBUTE_MISSING'
    | 'ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE',
  message: string,
): NodeJS.ErrnoException {
  const error: NodeJS.ErrnoException = new TypeError(message);
  error.code = code;
  return error;
}

export function validateImportAttributes(
  modulePath: string,
  attributes: ImportAttributes,
  referencingIdentifier: string,
): void {
  for (const key of Object.keys(attributes)) {
    if (key !== 'type') {
      throw makeImportAttributeError(
        'ERR_IMPORT_ATTRIBUTE_UNSUPPORTED',
        `Import attribute "${key}" with value "${attributes[key]}" is not supported (importing "${modulePath}" from ${referencingIdentifier})`,
      );
    }
  }

  const declaredType = attributes.type;
  const isJson = isJsonModule(modulePath);

  if (isJson) {
    if (declaredType === undefined) {
      // TODO(jest next major): match Node and throw
      // ERR_IMPORT_ATTRIBUTE_MISSING here. Until then, warn so existing users
      // without `with { type: 'json' }` keep working.
      const dedupeKey = `${referencingIdentifier}::${modulePath}`;
      if (!warnedMissingJsonAttributePairs.has(dedupeKey)) {
        if (warnedMissingJsonAttributePairs.size >= MAX_WARNED_PAIRS) {
          warnedMissingJsonAttributePairs.clear();
        }
        warnedMissingJsonAttributePairs.add(dedupeKey);
        const moduleLabel = describeForWarning(modulePath);
        console.warn(
          'Jest: importing JSON without an import attribute is deprecated and will be a hard error in the next major. ' +
            `Update the import of "${moduleLabel}" (from ${referencingIdentifier}): ` +
            "use `with { type: 'json' }` for static imports, or pass " +
            "`{ with: { type: 'json' } }` as the second argument to dynamic `import()`.",
        );
      }
      return;
    }
    if (declaredType !== 'json') {
      throw makeImportAttributeError(
        'ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE',
        `Module "${modulePath}" is not of type "${declaredType}"`,
      );
    }
    return;
  }

  // Non-JSON (implicit-type) module. Per HTML spec, the default type cannot
  // be re-asserted, so any explicit `type` attribute is rejected.
  if (declaredType !== undefined) {
    throw makeImportAttributeError(
      'ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE',
      `Module "${modulePath}" is not of type "${declaredType}"`,
    );
  }
}

const ESM_TRANSFORM_OPTIONS: TransformOptions = {
  isInternalModule: false,
  supportsDynamicImport: true,
  supportsExportNamespaceFrom: true,
  supportsStaticESM: true,
  supportsTopLevelAwait: true,
};

function stripFileScheme(specifier: string): string {
  return specifier.startsWith('file://') ? fileURLToPath(specifier) : specifier;
}

export interface EsmLoaderOptions {
  resolution: Resolution;
  fileCache: FileCache;
  transformCache: TransformCache;
  registries: ModuleRegistries;
  mockState: MockState;
  environment: JestEnvironment;
  cjsExportsCache: CjsExportsCache;
  coreModule: CoreModuleProvider;
  jestGlobals: JestGlobals;
  shouldLoadAsEsm: (modulePath: string) => boolean;
  requireModuleOrMock: (from: string, moduleName: string) => unknown;
  testState: TestState;
}

export class EsmLoader {
  private readonly resolution: Resolution;
  private readonly fileCache: FileCache;
  private readonly transformCache: TransformCache;
  private readonly registries: ModuleRegistries;
  private readonly mockState: MockState;
  private readonly environment: JestEnvironment;
  private readonly cjsExportsCache: CjsExportsCache;
  private readonly coreModule: CoreModuleProvider;
  private readonly jestGlobals: JestGlobals;
  private readonly shouldLoadAsEsm: (modulePath: string) => boolean;
  private readonly requireModuleOrMock: (
    from: string,
    moduleName: string,
  ) => unknown;
  private readonly testState: TestState;
  // Used only by the legacy async path; deletable when min-Node ≥ v24.9
  // (delete the block at the bottom of this file too - eslint/tsc will
  // surface anything else that becomes unused).
  private readonly linkingMap = new WeakMap<JestModule, Promise<unknown>>();
  private readonly evaluatingMap = new WeakMap<JestModule, Promise<void>>();

  constructor(options: EsmLoaderOptions) {
    this.resolution = options.resolution;
    this.fileCache = options.fileCache;
    this.transformCache = options.transformCache;
    this.registries = options.registries;
    this.mockState = options.mockState;
    this.environment = options.environment;
    this.cjsExportsCache = options.cjsExportsCache;
    this.coreModule = options.coreModule;
    this.jestGlobals = options.jestGlobals;
    this.shouldLoadAsEsm = options.shouldLoadAsEsm;
    this.requireModuleOrMock = options.requireModuleOrMock;
    this.testState = options.testState;
  }

  // `'load-async'` means the sync graph could not be completed — a concurrent
  // `await import()` is mid-flight, a dependency is async-only, etc. Surface
  // as ERR_REQUIRE_ESM with actionable context.
  //
  // Root-level mocks (`jest.unstable_mockModule(spec)` then `require(spec)`)
  // are not consulted - driving a SyntheticModule from `unlinked` to
  // `evaluated` needs the async link()/evaluate() pair. Transitive-dep mocks
  // still apply via the graph walker.
  requireEsmModule<T>(modulePath: string): T {
    const module = this.tryLoadGraphSync(modulePath, '', 'sync-required');
    if (module === LOAD_ASYNC) {
      const error: NodeJS.ErrnoException = new Error(
        `Cannot require() ES Module ${modulePath} synchronously: it is currently being loaded by a concurrent \`import()\`. Await that import before calling require(), or import this module instead of requiring it.`,
      );
      error.code = 'ERR_REQUIRE_ESM';
      throw error;
    }
    return module.namespace as T;
  }

  // Public for unit-test access. Production callers reach the sync graph
  // through `requireEsmModule` (sync require entry) or via `loadEsmModule`
  // (the legacy async entry, which first-tries this).
  tryLoadGraphSync(
    rootPath: string,
    rootQuery: string,
    mode: SyncEsmMode,
  ): ESModule | LoadAsync {
    this.testState.throwIfTornDown(
      'You are trying to `import` a file after the Jest environment has been torn down.',
    );

    const registry = this.registries.getActiveEsmRegistry();
    const rootKey = rootPath + rootQuery;

    const cached = registry.get(rootKey);
    if (cached) {
      if (cached instanceof Promise) return LOAD_ASYNC;
      // The legacy `loadEsmModule` source-text branch does `registry.set`
      // while the `SourceTextModule` is still `'unlinked'` (link runs later
      // in `linkAndEvaluateModule`); accessing `.namespace` on a non-evaluated
      // module throws `ERR_VM_MODULE_STATUS`. Surface settled entries
      // (`'evaluated'` / `'errored'`); bail otherwise.
      if (cached.status === 'evaluated') return cached as ESModule;
      if (cached.status === 'errored') throw cached.error;
      return LOAD_ASYNC;
    }

    const context = this.getContext();

    if (this.transformCache.hasMutex(rootKey)) return LOAD_ASYNC;

    const scratch = new Map<string, ScratchEntry>();
    const worklist: Array<WorklistEntry> = [
      {cacheKey: rootKey, modulePath: rootPath},
    ];

    while (worklist.length > 0) {
      const {cacheKey, modulePath} = worklist.pop()!;
      if (scratch.has(cacheKey)) continue;

      // Registry first, mutex second. Same settled-status gate as the root -
      // anything in `'unlinked'` / `'linking'` / `'linked'` / `'evaluating'`
      // is the legacy path mid-flight on this dep. Plugging an unlinked
      // module into the parent's `linkRequests` would fail Node's link
      // cascade; plugging a `'linked'` one would skip its body. Bail.
      const fromRegistry = registry.get(cacheKey);
      if (fromRegistry instanceof Promise) return LOAD_ASYNC;
      if (fromRegistry) {
        if (fromRegistry.status === 'errored') throw fromRegistry.error;
        if (fromRegistry.status !== 'evaluated') return LOAD_ASYNC;
        scratch.set(cacheKey, {
          cacheKey,
          kind: 'synthetic',
          module: fromRegistry,
        });
        continue;
      }
      if (this.transformCache.hasMutex(cacheKey)) return LOAD_ASYNC;

      if (this.resolution.isCoreModule(modulePath)) {
        scratch.set(cacheKey, {
          cacheKey,
          kind: 'synthetic',
          module: buildCoreSyntheticModule(
            modulePath,
            context,
            (name, prefix) => this.coreModule.require(name, prefix),
          ),
        });
        continue;
      }

      if (modulePath.startsWith('data:')) {
        const built = this.buildSyncDataUriEntry(
          modulePath,
          cacheKey,
          context,
          scratch,
          registry,
          worklist,
          mode,
        );
        if (built === LOAD_ASYNC) return LOAD_ASYNC;
        scratch.set(cacheKey, built);
        continue;
      }

      if (isWasm(modulePath)) {
        const wasmEntry = this.buildSyncWasmEntry(
          this.fileCache.readFileBuffer(modulePath),
          modulePath,
          cacheKey,
          context,
          scratch,
          registry,
          worklist,
          mode,
        );
        if (wasmEntry === LOAD_ASYNC) return LOAD_ASYNC;
        scratch.set(cacheKey, wasmEntry);
        continue;
      }

      if (!this.transformCache.canTransformSync(modulePath)) {
        if (mode === 'sync-required') {
          throw makeRequireAsyncError(
            modulePath,
            'a configured transformer is async-only',
          );
        }
        return LOAD_ASYNC;
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
          importModuleDynamically: this.dynamicImport,
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
                this.resolution.resolveEsm(parentPath, specifier),
              ).href;
            };
            (meta as JestImportMeta).jest =
              this.jestGlobals.jestObjectFor(modulePath);
          },
        },
      );

      if (
        typeof module.hasTopLevelAwait === 'function' &&
        module.hasTopLevelAwait()
      ) {
        if (mode === 'sync-required') {
          throw makeRequireAsyncError(modulePath, 'top-level await');
        }
        return LOAD_ASYNC;
      }

      // If we got here without `moduleRequests`, the capability gate is lying.
      invariant(
        module.moduleRequests !== undefined,
        `moduleRequests unavailable on ${modulePath}`,
      );
      const deps: Array<string> = [];
      for (const {specifier, attributes} of module.moduleRequests) {
        const resolved = this.resolveSpecifierForSyncGraph(
          modulePath,
          specifier,
          context,
          scratch,
          registry,
          mode,
        );
        if (resolved === LOAD_ASYNC) return LOAD_ASYNC;
        validateImportAttributes(resolved.modulePath, attributes, modulePath);
        deps.push(resolved.cacheKey);
        if (resolved.enqueue) worklist.push(resolved.enqueue);
      }

      scratch.set(cacheKey, {cacheKey, deps, kind: 'source', module});
    }

    for (const entry of scratch.values()) {
      if (entry.kind !== 'source') continue;
      const depModules = entry.deps.map(depKey => {
        const depEntry = scratch.get(depKey);
        invariant(
          depEntry,
          `Sync ESM graph missing dep ${depKey} for ${entry.cacheKey}. This is a bug in Jest, please report it!`,
        );
        return depEntry.module;
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
        return LOAD_ASYNC;
      }
    }

    for (const entry of scratch.values()) {
      if (!registry.has(entry.cacheKey)) {
        registry.set(entry.cacheKey, entry.module);
      }
    }

    rootModule.evaluate().catch(noop);

    if (rootModule.status === 'errored') {
      throw rootModule.error;
    }
    invariant(
      rootModule.status === 'evaluated',
      `Expected synchronous evaluation to complete for ${rootModule.identifier}, but module status is "${rootModule.status}". This is a bug in Jest, please report it!`,
    );

    return rootModule;
  }

  private getContext(): VMContext {
    invariant(
      typeof this.environment.getVmContext === 'function',
      'ES Modules are only supported if your test environment has the `getVmContext` function',
    );
    const context = this.environment.getVmContext();
    invariant(context, 'Test environment has been torn down');
    return context;
  }

  // Commits (or reuses) a synthetic-module entry under `cacheKey` in both the
  // local scratch and the long-lived registry. Returns `false` when the
  // registry holds something the caller must bail on: a mid-flight Promise
  // from the legacy async path, or a non-evaluated module (legacy can stash
  // an `'unlinked'` SourceTextModule here while link/evaluate runs).
  private tryCommitSynthetic(
    cacheKey: string,
    registry: ModuleRegistry | Map<string, JestModule>,
    scratch: Map<string, ScratchEntry>,
    build: () => VMModuleWithAsyncGraph,
  ): boolean {
    if (scratch.has(cacheKey)) return true;
    const fromRegistry = registry.get(cacheKey);
    if (fromRegistry instanceof Promise) return false;
    if (fromRegistry) {
      const cached = fromRegistry as VMModule;
      if (cached.status === 'errored') throw cached.error;
      if (cached.status !== 'evaluated') return false;
    }
    const module =
      (fromRegistry as VMModuleWithAsyncGraph | undefined) ?? build();
    if (!fromRegistry) registry.set(cacheKey, module);
    scratch.set(cacheKey, {cacheKey, kind: 'synthetic', module});
    return true;
  }

  private resolveSpecifierForSyncGraph(
    referencingIdentifier: string,
    specifier: string,
    context: VMContext,
    scratch: Map<string, ScratchEntry>,
    registry: ModuleRegistry | Map<string, JestModule>,
    mode: SyncEsmMode,
  ): ResolvedSyncSpecifier | LoadAsync {
    if (specifier === '@jest/globals') {
      const cacheKey = `@jest/globals/${referencingIdentifier}`;
      const ok = this.tryCommitSynthetic(cacheKey, registry, scratch, () =>
        this.jestGlobals.esmGlobalsModule(referencingIdentifier, context),
      );
      return ok ? {cacheKey, enqueue: null, modulePath: cacheKey} : LOAD_ASYNC;
    }

    if (specifier.startsWith('data:')) {
      const cacheKey = specifier;
      return {
        cacheKey,
        enqueue: {cacheKey, modulePath: specifier},
        modulePath: specifier,
      };
    }
    specifier = stripFileScheme(specifier);

    const [specifierPath, query = ''] = specifier.split('?');

    const {shouldMock, moduleID} = this.mockState.shouldMockEsmSync(
      referencingIdentifier,
      specifierPath,
    );
    if (shouldMock) {
      const mocked = this.importMockSync(
        specifierPath,
        moduleID,
        context,
        scratch,
        mode,
      );
      if (mocked === LOAD_ASYNC) return LOAD_ASYNC;
      return {
        cacheKey: mocked.cacheKey,
        enqueue: null,
        modulePath: specifierPath,
      };
    }

    if (this.resolution.isCoreModule(specifierPath)) {
      const cacheKey = specifierPath + query;
      return {
        cacheKey,
        enqueue: {cacheKey, modulePath: specifierPath},
        modulePath: specifierPath,
      };
    }

    let resolved: string;
    try {
      resolved = this.resolution.resolveEsm(
        referencingIdentifier,
        specifierPath,
      );
    } catch (error) {
      if (mode === 'sync-required') throw error;
      return LOAD_ASYNC;
    }

    const cacheKey = resolved + query;
    if (
      !resolved.endsWith('.json') &&
      !isWasm(resolved) &&
      !this.shouldLoadAsEsm(resolved)
    ) {
      try {
        const ok = this.tryCommitSynthetic(cacheKey, registry, scratch, () =>
          this.buildCjsAsEsmSyntheticModule(
            referencingIdentifier,
            resolved,
            context,
          ),
        );
        return ok
          ? {cacheKey, enqueue: null, modulePath: resolved}
          : LOAD_ASYNC;
      } catch (error) {
        if (!(error instanceof CjsParseError)) throw error;
        // File has ESM syntax but no ESM marker — fall through to the enqueue path.
      }
    }

    return {
      cacheKey,
      enqueue: {cacheKey, modulePath: resolved},
      modulePath: resolved,
    };
  }

  private importMockSync(
    moduleName: string,
    moduleID: string,
    context: VMContext,
    scratch: Map<string, ScratchEntry>,
    mode: SyncEsmMode,
  ): {cacheKey: string} | LoadAsync {
    const existing = this.registries.getModuleMock(moduleID);
    if (existing instanceof Promise) return LOAD_ASYNC;
    if (existing) {
      if (existing.status === 'errored') throw existing.error;

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
    // `shouldMockEsmSync` said this spec is mocked but no factory was
    // registered.
    invariant(
      factory !== undefined,
      'Attempting to import a mock without a factory',
    );

    const result = factory();
    if (isPromise(result)) {
      if (mode === 'sync-required') {
        throw makeRequireAsyncError(moduleName, 'mock factory is async');
      }
      return LOAD_ASYNC;
    }

    const synth = syntheticFromExports(
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
  // Uses `new WebAssembly.Module(bytes)` (sync, blocks on large modules).
  private buildSyncWasmEntry(
    bytes: BufferSource,
    identifier: string,
    cacheKey: string,
    context: VMContext,
    scratch: Map<string, ScratchEntry>,
    registry: ModuleRegistry | Map<string, JestModule>,
    worklist: Array<WorklistEntry>,
    mode: SyncEsmMode,
  ): ScratchEntry | LoadAsync {
    const wasmModule = new WebAssembly.Module(bytes);

    const moduleSpecToCacheKey = new Map<string, string>();
    for (const {module: depSpec} of WebAssembly.Module.imports(wasmModule)) {
      if (moduleSpecToCacheKey.has(depSpec)) continue;
      const resolved = this.resolveSpecifierForSyncGraph(
        identifier,
        depSpec,
        context,
        scratch,
        registry,
        mode,
      );
      if (resolved === LOAD_ASYNC) return LOAD_ASYNC;
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
        return depEntry.module.namespace as Record<string, unknown>;
      },
    );

    return {
      cacheKey,
      kind: 'synthetic',
      module: synthetic,
    };
  }

  private buildSyncDataUriEntry(
    specifier: string,
    cacheKey: string,
    context: VMContext,
    scratch: Map<string, ScratchEntry>,
    registry: ModuleRegistry | Map<string, JestModule>,
    worklist: Array<WorklistEntry>,
    mode: SyncEsmMode,
  ): ScratchEntry | LoadAsync {
    const esmDynamicImport = this.dynamicImport;
    const {mime, code} = parseDataUri(specifier);

    if (mime === 'application/wasm') {
      return this.buildSyncWasmEntry(
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

    const module = new SourceTextModule(code as string, {
      context,
      identifier: specifier,
      importModuleDynamically: esmDynamicImport,
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
      return LOAD_ASYNC;
    }

    invariant(
      module.moduleRequests !== undefined,
      `moduleRequests unavailable on ${specifier}`,
    );
    const deps: Array<string> = [];
    for (const {specifier: depSpec, attributes} of module.moduleRequests) {
      const resolved = this.resolveSpecifierForSyncGraph(
        specifier,
        depSpec,
        context,
        scratch,
        registry,
        mode,
      );
      if (resolved === LOAD_ASYNC) return LOAD_ASYNC;
      validateImportAttributes(resolved.modulePath, attributes, specifier);
      deps.push(resolved.cacheKey);
      if (resolved.enqueue) worklist.push(resolved.enqueue);
    }

    return {cacheKey, deps, kind: 'source', module};
  }

  // Synthetic-module wrappers that close over the primitive deps. The
  // `requireModuleOrMock` callback inside `buildCjsAsEsmSyntheticModule`
  // is the extension-point bridge to `Runtime.requireModuleOrMock`.
  private buildCjsAsEsmSyntheticModule(
    from: string,
    modulePath: string,
    context: VMContext,
  ): SyntheticModule {
    return buildCjsAsEsmSyntheticModule(
      from,
      modulePath,
      context,
      this.requireModuleOrMock,
      this.cjsExportsCache,
    );
  }

  // TODO: legacy async path - everything below is deletable when min-Node
  // ≥ v24.9 (the sync core handles all entry shapes). Drop the `linkingMap`
  // / `evaluatingMap` fields with it.

  // Called from CJS bodies via `compileFunction`'s `importModuleDynamically`.
  dynamicImportFromCjs(
    specifier: string,
    identifier: string,
    context: VMContext,
    importAttributes?: ImportAttributes,
  ): Promise<VMModule> {
    return this.resolveModule<VMModule>(specifier, identifier, context).then(
      m => {
        validateImportAttributes(
          m.identifier,
          importAttributes ?? {},
          identifier,
        );
        return this.linkAndEvaluateModule(m);
      },
    );
  }

  // Public entry for `Runtime.unstable_importModule`. Runtime keeps the
  // public method as the override seam; this is the body.
  async loadAndEvaluate(from: string, moduleName?: string): Promise<unknown> {
    invariant(
      runtimeSupportsVmModules,
      'You need to run with a version of node that supports ES Modules in the VM API. See https://jestjs.io/docs/ecmascript-modules',
    );
    const [specifierPath, query] = (moduleName ?? '').split('?');
    const modulePath = await this.resolution.resolveEsmAsync(
      from,
      specifierPath,
    );
    const module = await this.loadEsmModule(modulePath, query);
    return this.linkAndEvaluateModule(module);
  }

  private async loadEsmModule(
    modulePath: string,
    query = '',
  ): Promise<ESModule> {
    // Two gates here. `supportsSyncEvaluate` is a Node-version check: the
    // sync core relies on `SyntheticModule` starting `'linked'` and on
    // `evaluate()` completing sync, both of which need v22.21+ / v24.8+.
    // `canResolveSync` is a configured-resolver check: with an async-only
    // user resolver `findNodeModule` silently falls back to the default
    // resolver and would silently miss user mappings.
    if (supportsSyncEvaluate && this.resolution.canResolveSync()) {
      const synced = this.tryLoadGraphSync(modulePath, query, 'sync-preferred');
      if (synced !== LOAD_ASYNC) return synced;
    }

    const cacheKey = modulePath + query;
    const registry = this.registries.getActiveEsmRegistry();

    if (this.transformCache.hasMutex(cacheKey)) {
      await this.transformCache.awaitMutex(cacheKey);
    }

    if (!registry.has(cacheKey)) {
      const context = this.getContext();

      let transformResolve: () => void;
      let transformReject: (error?: unknown) => void;

      const mutex = new Promise<void>((resolve, reject) => {
        transformResolve = resolve;
        transformReject = reject;
      });
      // Prevent an unhandled-rejection warning when no concurrent caller is
      // awaiting the mutex — the originating caller re-throws the error itself.
      // Concurrent waiters still see the rejection because they await `mutex`.
      mutex.catch(noop);
      this.transformCache.setMutex(cacheKey, mutex);

      invariant(
        transformResolve! && transformReject!,
        'Promise initialization should be sync - please report this bug to Jest!',
      );

      try {
        if (isWasm(modulePath)) {
          const wasm = this.importWasmModule(
            this.fileCache.readFileBuffer(modulePath),
            modulePath,
            context,
          );
          registry.set(cacheKey, wasm);
          transformResolve();
          return wasm;
        }

        if (this.resolution.isCoreModule(modulePath)) {
          const core = evaluateSyntheticModule(
            buildCoreSyntheticModule(modulePath, context, (name, prefix) =>
              this.coreModule.require(name, prefix),
            ),
          );
          registry.set(cacheKey, core);
          transformResolve();
          return core;
        }

        const transformedCode = this.transformCache.canTransformSync(modulePath)
          ? this.transformCache.transform(modulePath, ESM_TRANSFORM_OPTIONS)
          : await this.transformCache.transformAsync(
              modulePath,
              ESM_TRANSFORM_OPTIONS,
            );

        let module: VMModule;
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
            importModuleDynamically: this.dynamicImport,
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
                  this.resolution.resolveEsm(parentPath, specifier),
                ).href;
              };
              (meta as JestImportMeta).jest =
                this.jestGlobals.jestObjectFor(modulePath);
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
      } finally {
        this.transformCache.clearMutex(cacheKey);
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
    if (
      this.testState.bailIfTornDown(
        'You are trying to `import` a file after the Jest environment has been torn down.',
      )
    ) {
      // @ts-expect-error -- exiting
      return;
    }

    const registry = this.registries.getActiveEsmRegistry();

    if (specifier === '@jest/globals') {
      const globalsIdentifier = `@jest/globals/${referencingIdentifier}`;
      const fromCache = registry.get(globalsIdentifier);
      if (fromCache) {
        return fromCache as T;
      }
      const globals = evaluateSyntheticModule(
        this.jestGlobals.esmGlobalsModule(referencingIdentifier, context),
      );
      registry.set(globalsIdentifier, globals);
      return globals as T;
    }

    if (specifier.startsWith('data:')) {
      const dataDecision = await this.mockState.shouldMockEsmAsync(
        referencingIdentifier,
        specifier,
      );
      if (dataDecision.shouldMock) {
        return this.importMock(specifier, dataDecision.moduleID, context);
      }
      const fromCache = registry.get(specifier);
      if (fromCache) {
        return fromCache as T;
      }
      const {mime, code} = parseDataUri(specifier);
      let module: VMModule;
      if (mime === 'application/wasm') {
        module = await this.importWasmModule(
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
          importModuleDynamically: this.dynamicImport,
          initializeImportMeta(meta) {
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

    const decision = await this.mockState.shouldMockEsmAsync(
      referencingIdentifier,
      specifierPath,
    );
    if (decision.shouldMock) {
      return this.importMock(specifierPath, decision.moduleID, context);
    }

    const resolved = await this.resolution.resolveEsmAsync(
      referencingIdentifier,
      specifierPath,
    );

    if (
      resolved.endsWith('.json') ||
      this.resolution.isCoreModule(resolved) ||
      this.shouldLoadAsEsm(resolved)
    ) {
      return this.loadEsmModule(resolved, query) as T;
    }

    return this.loadCjsAsEsm(referencingIdentifier, resolved, context) as T;
  }

  private async linkAndEvaluateModule(module: VMModule): Promise<VMModule> {
    if (
      this.testState.bailIfTornDown(
        'You are trying to `import` a file after the Jest environment has been torn down.',
      )
    ) {
      // @ts-expect-error: exiting early
      return;
    }

    // Already-errored module from a prior failed evaluation.
    if (module.status === 'errored') {
      throw module.error;
    }

    if (module.status === 'unlinked') {
      this.linkingMap.set(
        module,
        module.link(async (specifier, referencingModule, extra) => {
          const resolved = await this.resolveModule<VMModule>(
            specifier,
            referencingModule.identifier,
            referencingModule.context,
          );
          const extraAttrs = extra as ModuleLinkExtra | undefined;
          validateImportAttributes(
            resolved.identifier,
            extraAttrs?.attributes ?? extraAttrs?.assert ?? {},
            referencingModule.identifier,
          );
          return resolved;
        }),
      );
    }

    const linkPromise = this.linkingMap.get(module);
    if (linkPromise != null) {
      await linkPromise;
    } else if (module.status === 'linking') {
      // Module entered 'linking' via Node's cascade (a parent's link()
      // recursed into this dep without going through our code). We have no
      // promise to await, so yield via setImmediate - which lets all pending
      // microtasks (including Node's internal linker chain) drain - until
      // linking finishes.
      const deadline = Date.now() + 5000;
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
        // await, so we don't need to yield. Errors land on `module.status`,
        // not as a Promise rejection. Gated on `supportsSyncEvaluate` because
        // pre-v22.21 / pre-v24.8 Node returns a genuinely-async Promise here
        // and the status invariant below would fire on `'evaluating'`.
        void module.evaluate().catch(noop);
        const status = module.status as VMModule['status'];
        if (status === 'errored') {
          throw module.error;
        }
        invariant(
          status === 'evaluated',
          `Expected synchronous evaluation to complete for ${module.identifier}, but module status is "${status}". This is a bug in Jest, please report it!`,
        );
      } else {
        // Async path: TLA somewhere in the graph, or Node lacks the v22.21+ /
        // v24.8+ sync-evaluate semantics. Store the promise so concurrent
        // callers finding the module in `'evaluating'` await the same one.
        this.evaluatingMap.set(module, module.evaluate());
      }
    }

    await this.evaluatingMap.get(module);

    return module;
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
      synthetic = this.buildCjsAsEsmSyntheticModule(from, modulePath, context);
    } catch (error) {
      if (!(error instanceof CjsParseError)) throw error;
      return this.loadEsmModule(modulePath);
    }

    const evaluated = evaluateSyntheticModule(synthetic);
    registry.set(modulePath, evaluated);
    return evaluated;
  }

  private async importMock<T = unknown>(
    moduleName: string,
    moduleID: string,
    context: VMContext,
  ): Promise<T> {
    if (this.registries.hasModuleMock(moduleID)) {
      return this.registries.getModuleMock(moduleID) as T;
    }

    const factory = this.mockState.getEsmFactory(moduleID);
    if (factory) {
      const invokedFactory = (await factory()) as Record<string, unknown>;
      const module = syntheticFromExports(moduleName, context, invokedFactory);
      this.registries.setModuleMock(moduleID, module);
      return evaluateSyntheticModule(module) as T;
    }

    throw new Error('Attempting to import a mock without a factory');
  }

  private async importWasmModule(
    source: BufferSource,
    identifier: string,
    context: VMContext,
  ): Promise<SyntheticModule> {
    // Use async `WebAssembly.compile` (rather than the sync constructor used
    // by the v24.9+ sync core) to avoid blocking the event loop on large wasm
    // modules in the legacy async path.
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
        // be linking resolvedModule. Calling linkAndEvaluateModule would
        // spin-wait via setImmediate, but the cascade can't finish until this
        // linker returns - deadlock. The SyntheticModule's body runs only
        // after Node has fully evaluated all deps in topological order.
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

  // Shared async dynamic-import callback installed on every SourceTextModule
  // we construct. Goes through the legacy async path; revisit when min-Node
  // reaches v24.9 (Node may handle dynamic imports for us by then).
  private dynamicImport = async (
    specifier: string,
    referencingModule: VMModule,
    importAttributes?: ImportAttributes,
  ): Promise<VMModule> => {
    invariant(
      runtimeSupportsVmModules,
      'You need to run with a version of node that supports ES Modules in the VM API. See https://jestjs.io/docs/ecmascript-modules',
    );
    this.testState.throwIfBetweenTests(
      'You are trying to `import` a file outside of the scope of the test code.',
    );
    this.testState.throwIfTornDown(
      'You are trying to `import` a file after the Jest environment has been torn down.',
    );
    const dyn = await this.resolveModule<VMModule>(
      specifier,
      referencingModule.identifier,
      referencingModule.context,
    );
    validateImportAttributes(
      dyn.identifier,
      importAttributes ?? {},
      referencingModule.identifier,
    );
    return this.linkAndEvaluateModule(dyn);
  };
}
