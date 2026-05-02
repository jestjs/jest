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
import type {Jest, JestEnvironment, JestImportMeta} from '@jest/environment';
import {invariant} from 'jest-util';
import {noop} from '../helpers';
import type {FileCache} from './FileCache';
import type {MockState} from './MockState';
import type {ModuleRegistries} from './ModuleRegistries';
import {type Resolution, isWasm} from './Resolution';
import type {TransformCache, TransformOptions} from './TransformCache';
import type {ESModule, JestModule, ModuleRegistry} from './moduleTypes';
import {
  buildJsonSyntheticModule,
  buildWasmSyntheticModule,
  syntheticFromExports,
} from './syntheticBuilders';

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

// `'sync-required'` is `require(esm)` (must be loaded synchronously, throw a
// typed error on edges that would normally bail). `'sync-preferred'` is the
// fast path for `await import()` (try sync; fall back to the legacy async
// loader on any unsupported edge).
export type SyncEsmMode = 'sync-preferred' | 'sync-required';

type WorklistEntry = {
  cacheKey: string;
  modulePath: string;
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

export type TestState = 'loading' | 'inTest' | 'betweenTests' | 'tornDown';

export interface EsmGraphLoaderDeps {
  resolution: Resolution;
  fileCache: FileCache;
  transformCache: TransformCache;
  registries: ModuleRegistries;
  mockState: MockState;
  environment: JestEnvironment;
  // Callbacks bridging back to public Runtime entry points. Subclassing
  // Runtime and overriding `unstable_shouldLoadAsEsm` flows through here.
  shouldLoadAsEsm: (modulePath: string) => boolean;
  // Synthetic-module builders owned by Runtime (some are shared with the
  // legacy async path; their wrappers also embed the `requireModuleOrMock`
  // bridge for CJS-as-ESM, preserving the override seam).
  buildCoreSyntheticModule: (name: string, ctx: VMContext) => SyntheticModule;
  buildJestGlobalsSyntheticModule: (
    from: string,
    ctx: VMContext,
  ) => SyntheticModule;
  buildCjsAsEsmSyntheticModule: (
    from: string,
    modulePath: string,
    ctx: VMContext,
  ) => SyntheticModule;
  // Dynamic import goes through the legacy async path for now.
  esmDynamicImport: (
    specifier: string,
    referencingModule: VMModule,
  ) => Promise<VMModule>;
  // Cache-or-create lookup; Runtime owns `jestObjectCaches`. Tier 3.4 collapses
  // this into a JestObjectFactory ref.
  getJestObject: (from: string) => Jest;
  // Runtime hooks.
  getTestState: () => TestState;
  logFormattedReferenceError: (msg: string) => void;
}

export class EsmLoader {
  private readonly deps: EsmGraphLoaderDeps;

  constructor(deps: EsmGraphLoaderDeps) {
    this.deps = deps;
  }

  // A `null` here means the legacy async path is mid-flight on this same
  // module (registry holds a Promise from a concurrent `await import()`);
  // surface as ERR_REQUIRE_ESM with actionable context.
  //
  // Root-level mocks (`jest.unstable_mockModule(spec)` then `require(spec)`)
  // are not consulted - driving a SyntheticModule from `unlinked` to
  // `evaluated` needs the async link()/evaluate() pair. Transitive-dep mocks
  // still apply via the graph walker.
  requireEsmModule<T>(modulePath: string): T {
    const module = this.tryLoadGraphSync(modulePath, '', 'sync-required');
    if (!module) {
      const error: NodeJS.ErrnoException = new Error(
        `Cannot require() ES Module ${modulePath} synchronously: it is currently being loaded by a concurrent \`import()\`. Await that import before calling require(), or import this module instead of requiring it.`,
      );
      error.code = 'ERR_REQUIRE_ESM';
      throw error;
    }
    return (module as VMModule).namespace as T;
  }

  tryLoadGraphSync(
    rootPath: string,
    rootQuery: string,
    mode: SyncEsmMode,
  ): ESModule | null {
    const {
      registries,
      transformCache,
      resolution,
      fileCache,
      getTestState,
      logFormattedReferenceError,
      buildCoreSyntheticModule,
      esmDynamicImport,
      getJestObject,
    } = this.deps;
    if (getTestState() === 'tornDown') {
      logFormattedReferenceError(
        'You are trying to `import` a file after the Jest environment has been torn down.',
      );
      process.exitCode = 1;
      return null;
    }
    // The original `betweenTests` throw fires only when `!supportsDynamicImport`,
    // which is impossible here: EsmGraphLoader runs only when `supportsSyncEvaluate`
    // is true (stricter than `supportsDynamicImport`). Dead branch elided.

    const registry = registries.getActiveEsmRegistry();
    const rootKey = rootPath + rootQuery;

    const cached = registry.get(rootKey);
    if (cached && !(cached instanceof Promise)) {
      return cached as ESModule;
    }
    if (cached instanceof Promise) {
      return null;
    }

    const context = this.getContext();

    if (transformCache.hasMutex(rootKey)) return null;

    const scratch = new Map<string, ScratchEntry>();
    const worklist: Array<WorklistEntry> = [
      {cacheKey: rootKey, modulePath: rootPath},
    ];

    while (worklist.length > 0) {
      const {cacheKey, modulePath} = worklist.pop()!;
      if (scratch.has(cacheKey)) continue;

      if (transformCache.hasMutex(cacheKey)) return null;

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

      if (resolution.isCoreModule(modulePath)) {
        scratch.set(cacheKey, {
          cacheKey,
          kind: 'synthetic',
          module: buildCoreSyntheticModule(
            modulePath,
            context,
          ) as VMModuleWithAsyncGraph,
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
        if (built === null) return null;
        scratch.set(cacheKey, built);
        continue;
      }

      if (isWasm(modulePath)) {
        const wasmEntry = this.buildSyncWasmEntry(
          fileCache.readFileBuffer(modulePath),
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

      if (!transformCache.canTransformSync(modulePath)) {
        if (mode === 'sync-required') {
          throw makeRequireAsyncError(
            modulePath,
            'a configured transformer is async-only',
          );
        }
        return null;
      }

      if (modulePath.endsWith('.json')) {
        scratch.set(cacheKey, {
          cacheKey,
          kind: 'synthetic',
          module: buildJsonSyntheticModule(
            transformCache.transform(modulePath, ESM_TRANSFORM_OPTIONS),
            modulePath,
            context,
          ) as VMModuleWithAsyncGraph,
        });
        continue;
      }

      const transformedCode = transformCache.transform(
        modulePath,
        ESM_TRANSFORM_OPTIONS,
      );

      const module: VMModuleWithAsyncGraph = new SourceTextModule(
        transformedCode,
        {
          context,
          identifier: modulePath,
          importModuleDynamically: esmDynamicImport,
          initializeImportMeta: meta => {
            const metaUrl = pathToFileURL(modulePath).href;
            meta.url = metaUrl;
            // @ts-expect-error Jest uses @types/node@18.
            meta.filename = modulePath;
            // @ts-expect-error Jest uses @types/node@18.
            meta.dirname = path.dirname(modulePath);
            meta.resolve = (specifier, parent: string | URL = metaUrl) => {
              const parentPath = fileURLToPath(parent);
              return pathToFileURL(resolution.resolveEsm(parentPath, specifier))
                .href;
            };
            (meta as JestImportMeta).jest = getJestObject(modulePath);
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
        return null;
      }

      const requests = module.moduleRequests;
      if (requests === undefined) return null;
      const deps: Array<string> = [];
      for (const {specifier} of requests) {
        const resolved = this.resolveSpecifierForSyncGraph(
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
        return null;
      }
    }

    for (const entry of scratch.values()) {
      if (!registry.has(entry.cacheKey)) {
        registry.set(entry.cacheKey, entry.module);
      }
    }

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

  private getContext(): VMContext {
    const {environment} = this.deps;
    invariant(
      typeof environment.getVmContext === 'function',
      'ES Modules are only supported if your test environment has the `getVmContext` function',
    );
    const context = environment.getVmContext();
    invariant(context, 'Test environment has been torn down');
    return context;
  }

  private commitSyntheticToScratch(
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

  private resolveSpecifierForSyncGraph(
    referencingIdentifier: string,
    specifier: string,
    context: VMContext,
    scratch: Map<string, ScratchEntry>,
    registry: ModuleRegistry | Map<string, JestModule>,
    mode: SyncEsmMode,
  ): {cacheKey: string; enqueue: WorklistEntry | null} | null {
    const {
      buildJestGlobalsSyntheticModule,
      buildCjsAsEsmSyntheticModule,
      mockState,
      resolution,
      shouldLoadAsEsm,
    } = this.deps;

    if (specifier === '@jest/globals') {
      const cacheKey = `@jest/globals/${referencingIdentifier}`;
      const ok = this.commitSyntheticToScratch(
        cacheKey,
        registry,
        scratch,
        () =>
          buildJestGlobalsSyntheticModule(
            referencingIdentifier,
            context,
          ) as VMModuleWithAsyncGraph,
      );
      return ok ? {cacheKey, enqueue: null} : null;
    }

    if (specifier.startsWith('data:')) {
      const cacheKey = specifier;
      return {
        cacheKey,
        enqueue: {cacheKey, modulePath: specifier},
      };
    }
    specifier = stripFileScheme(specifier);

    const [specifierPath, query = ''] = specifier.split('?');

    if (mockState.shouldMockEsmSync(referencingIdentifier, specifierPath)) {
      const mocked = this.importMockSync(
        referencingIdentifier,
        specifierPath,
        context,
        scratch,
        mode,
      );
      if (mocked === null) return null;
      return {cacheKey: mocked.cacheKey, enqueue: null};
    }

    if (resolution.isCoreModule(specifierPath)) {
      const cacheKey = specifierPath + query;
      return {
        cacheKey,
        enqueue: {cacheKey, modulePath: specifierPath},
      };
    }

    let resolved: string;
    try {
      resolved = resolution.resolveEsm(referencingIdentifier, specifierPath);
    } catch {
      return null;
    }

    const cacheKey = resolved + query;
    if (
      !resolved.endsWith('.json') &&
      !isWasm(resolved) &&
      !shouldLoadAsEsm(resolved)
    ) {
      const ok = this.commitSyntheticToScratch(
        cacheKey,
        registry,
        scratch,
        () =>
          buildCjsAsEsmSyntheticModule(
            referencingIdentifier,
            resolved,
            context,
          ) as VMModuleWithAsyncGraph,
      );
      return ok ? {cacheKey, enqueue: null} : null;
    }

    return {
      cacheKey,
      enqueue: {cacheKey, modulePath: resolved},
    };
  }

  private importMockSync(
    from: string,
    moduleName: string,
    context: VMContext,
    scratch: Map<string, ScratchEntry>,
    mode: SyncEsmMode,
  ): {cacheKey: string} | null {
    const {mockState, registries} = this.deps;
    const moduleID = mockState.getEsmModuleId(from, moduleName);

    const existing = registries.getModuleMock(moduleID);
    if (existing instanceof Promise) return null;
    if (existing) {
      if (!scratch.has(moduleID)) {
        scratch.set(moduleID, {
          cacheKey: moduleID,
          kind: 'synthetic',
          module: existing as VMModuleWithAsyncGraph,
        });
      }
      return {cacheKey: moduleID};
    }

    const factory = mockState.getEsmFactory(moduleID);
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
      return null;
    }

    const synth = syntheticFromExports(
      moduleName,
      context,
      result as Record<string, unknown>,
    );
    registries.setModuleMock(moduleID, synth);
    scratch.set(moduleID, {
      cacheKey: moduleID,
      kind: 'synthetic',
      module: synth as VMModuleWithAsyncGraph,
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
  ): ScratchEntry | null {
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
      module: synthetic as VMModuleWithAsyncGraph,
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
  ): ScratchEntry | null {
    const {esmDynamicImport} = this.deps;
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
        module: buildJsonSyntheticModule(
          code as string,
          specifier,
          context,
        ) as VMModuleWithAsyncGraph,
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
      return null;
    }

    const requests = module.moduleRequests;
    if (requests === undefined) return null;
    const deps: Array<string> = [];
    for (const {specifier: depSpec} of requests) {
      const resolved = this.resolveSpecifierForSyncGraph(
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
}
