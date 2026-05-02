/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import nativeModule from 'node:module';
import * as path from 'node:path';
import type {Module as VMModule} from 'node:vm';
import type {Module} from '@jest/environment';
import type {InitialModule, JestModule, ModuleRegistry} from './moduleTypes';

// Only expose modules whose `namespace` is readable without throwing or
// exposing TDZ values: `unlinked`/`linking` throw `ERR_VM_MODULE_STATUS`, and
// a `linked` SourceTextModule's namespace properties are in TDZ until
// evaluate runs (reading them throws `ReferenceError`).
const isLiveEsm = (entry: JestModule | undefined): entry is VMModule => {
  if (!entry || entry instanceof Promise) return false;
  const status = (entry as VMModule).status;
  return status === 'evaluated' || status === 'errored';
};

// `require.cache` mutators no-op (return true) to mirror legacy CJS Module
// semantics. We don't support deletions yet.
const notPermittedMethod = () => true;

// Owns every module/mock cache plus the require.cache Proxy and the
// `jest.isolateModules{,Async}` overlay. CJS, ESM, and mock lookups all route
// through `isolatedModule*` first when isolation is active; `internalModule*`
// is the only registry that bypasses isolation. `_generateMock` uses
// `withScratchRegistries` for a synchronous "clean module + mock cache"
// snapshot during automock construction.
export default class ModuleRegistries {
  private moduleRegistry: ModuleRegistry = new Map();
  private readonly internalModuleRegistry: ModuleRegistry = new Map();
  private readonly esModuleRegistry = new Map<string, JestModule>();
  private mockRegistry = new Map<string, unknown>();
  private readonly moduleMockRegistry = new Map<string, JestModule>();

  private isolatedModuleRegistry: ModuleRegistry | null = null;
  private isolatedMockRegistry: Map<string, unknown> | null = null;

  private readonly esmRequireCacheWrappers = new WeakMap<
    VMModule,
    NodeModule
  >();

  // CJS module cache. During isolation, routed to the isolated overlay.
  getCjs(p: string): InitialModule | Module | JestModule | undefined {
    return (this.isolatedModuleRegistry ?? this.moduleRegistry).get(p);
  }
  setCjs(p: string, m: InitialModule | Module | JestModule): void {
    (this.isolatedModuleRegistry ?? this.moduleRegistry).set(p, m);
  }
  hasCjs(p: string): boolean {
    return (this.isolatedModuleRegistry ?? this.moduleRegistry).has(p);
  }
  deleteCjs(p: string): void {
    (this.isolatedModuleRegistry ?? this.moduleRegistry).delete(p);
  }

  // CJS internal module cache. Always main; never isolated.
  getInternalCjs(p: string): InitialModule | Module | JestModule | undefined {
    return this.internalModuleRegistry.get(p);
  }
  setInternalCjs(p: string, m: InitialModule | Module | JestModule): void {
    this.internalModuleRegistry.set(p, m);
  }
  hasInternalCjs(p: string): boolean {
    return this.internalModuleRegistry.has(p);
  }

  // ESM module cache. Same isolation overlay as CJS - the existing design
  // shares `_isolatedModuleRegistry` between the two.
  getEsm(key: string): InitialModule | Module | JestModule | undefined {
    return (this.isolatedModuleRegistry ?? this.esModuleRegistry).get(key);
  }
  setEsm(key: string, m: JestModule): void {
    (this.isolatedModuleRegistry ?? this.esModuleRegistry).set(key, m);
  }
  hasEsm(key: string): boolean {
    return (this.isolatedModuleRegistry ?? this.esModuleRegistry).has(key);
  }

  // Mock cache. Routed to the isolated overlay during isolation.
  getMock(id: string): unknown {
    return (this.isolatedMockRegistry ?? this.mockRegistry).get(id);
  }
  setMock(id: string, m: unknown): void {
    (this.isolatedMockRegistry ?? this.mockRegistry).set(id, m);
  }
  hasMock(id: string): boolean {
    return (this.isolatedMockRegistry ?? this.mockRegistry).has(id);
  }

  // Module mock cache (for `unstable_mockModule`). Always main.
  getModuleMock(id: string): JestModule | undefined {
    return this.moduleMockRegistry.get(id);
  }
  setModuleMock(id: string, m: JestModule): void {
    this.moduleMockRegistry.set(id, m);
  }
  hasModuleMock(id: string): boolean {
    return this.moduleMockRegistry.has(id);
  }

  // Returns the active ESM Map (isolated overlay if isolating, else the main
  // ESM map). Exposed for the sync ESM graph walker which keeps the registry
  // as a local for repeated `get`/`has`/`set` operations. Note: the isolation
  // overlay is shared with CJS, so when used in isolation the map's value
  // type widens to the union; the ESM walker only ever inserts/reads
  // JestModule values keyed by ESM cache keys.
  getActiveEsmRegistry(): Map<string, JestModule> {
    return (this.isolatedModuleRegistry ?? this.esModuleRegistry) as Map<
      string,
      JestModule
    >;
  }

  // Returns the active CJS Map. `internal=true` always returns the internal
  // cache; otherwise routes through the isolated overlay when active.
  getActiveCjsRegistry(internal: boolean): ModuleRegistry {
    if (internal) return this.internalModuleRegistry;
    return this.isolatedModuleRegistry ?? this.moduleRegistry;
  }

  // Returns the active mock Map.
  getActiveMockRegistry(): Map<string, unknown> {
    return this.isolatedMockRegistry ?? this.mockRegistry;
  }

  // Whether `jest.isolateModules` is currently active.
  isIsolated(): boolean {
    return (
      this.isolatedModuleRegistry !== null || this.isolatedMockRegistry !== null
    );
  }

  enterIsolated(callerName: 'isolateModules' | 'isolateModulesAsync'): void {
    if (this.isIsolated()) {
      const other =
        callerName === 'isolateModules'
          ? 'isolateModulesAsync'
          : 'isolateModules';
      throw new Error(
        `${callerName} cannot be nested inside another ${callerName} or ${other}.`,
      );
    }
    this.isolatedModuleRegistry = new Map();
    this.isolatedMockRegistry = new Map();
  }

  exitIsolated(): void {
    this.isolatedModuleRegistry?.clear();
    this.isolatedMockRegistry?.clear();
    this.isolatedModuleRegistry = null;
    this.isolatedMockRegistry = null;
  }

  // Used by `_generateMock` to load a module against fresh, scratch CJS and
  // mock registries, then restore the originals. Synchronous: the user fn
  // must complete before `withScratchRegistries` returns.
  withScratchRegistries<T>(fn: () => T): T {
    const origMock = this.mockRegistry;
    const origModule = this.moduleRegistry;
    this.mockRegistry = new Map();
    this.moduleRegistry = new Map();
    try {
      return fn();
    } finally {
      this.mockRegistry = origMock;
      this.moduleRegistry = origModule;
    }
  }

  // Wraps an ESM `module.namespace` so it looks like a Node CJS module entry
  // for `require.cache` consumers. Cached on the VMModule so repeated lookups
  // return the same object.
  wrapEsmForRequireCache(filename: string, esm: VMModule): NodeModule {
    const existing = this.esmRequireCacheWrappers.get(esm);
    if (existing) return existing;
    const dir = path.dirname(filename);
    const wrapper = {
      children: [],
      exports: esm.namespace,
      filename,
      id: filename,
      isPreloading: false,
      loaded: true,
      parent: null,
      path: dir,
      paths: (
        nativeModule.Module as unknown as {
          _nodeModulePaths: (from: string) => Array<string>;
        }
      )._nodeModulePaths(dir),
      require: (() => {
        throw new Error(
          'require.cache entries from native ESM cannot be require()d',
        );
      }) as unknown as NodeModule['require'],
    } satisfies NodeModule;
    this.esmRequireCacheWrappers.set(esm, wrapper);
    return wrapper;
  }

  // Builds the `require.cache` Proxy. Read-only: `defineProperty`,
  // `deleteProperty`, and `set` no-op-return-true (the legacy CJS Module
  // semantic). Reads route through `getCjs` first, then fall back to a live
  // ESM entry wrapped via `wrapEsmForRequireCache`.
  createRequireCacheProxy(): NodeJS.Require['cache'] {
    const esmEntry = (key: string) => {
      const entry = this.esModuleRegistry.get(key);
      if (!isLiveEsm(entry)) return undefined;
      return this.wrapEsmForRequireCache(key, entry);
    };
    return new Proxy<NodeJS.Require['cache']>(Object.create(null), {
      defineProperty: notPermittedMethod,
      deleteProperty: notPermittedMethod,
      get: (_target, key) => {
        if (typeof key !== 'string') return undefined;
        return (
          (this.moduleRegistry.get(key) as NodeModule | undefined) ??
          esmEntry(key)
        );
      },
      getOwnPropertyDescriptor() {
        return {configurable: true, enumerable: true};
      },
      has: (_target, key) => {
        if (typeof key !== 'string') return false;
        return (
          this.moduleRegistry.has(key) ||
          isLiveEsm(this.esModuleRegistry.get(key))
        );
      },
      ownKeys: () => {
        const keys = new Set<string>(this.moduleRegistry.keys());
        for (const [key, entry] of this.esModuleRegistry) {
          if (isLiveEsm(entry)) keys.add(key);
        }
        return [...keys];
      },
      set: notPermittedMethod,
    });
  }

  // `resetModules`: drop everything except the internal cache and the
  // ESM-require-cache wrapper WeakMap (GC handles the latter naturally).
  clearForReset(): void {
    this.exitIsolated();
    this.mockRegistry.clear();
    this.moduleRegistry.clear();
    this.esModuleRegistry.clear();
    this.moduleMockRegistry.clear();
  }

  // `teardown`: drop everything including internal CJS modules.
  clear(): void {
    this.clearForReset();
    this.internalModuleRegistry.clear();
  }
}
