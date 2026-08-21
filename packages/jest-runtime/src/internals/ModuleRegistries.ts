/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import nativeModule from 'node:module';
import * as path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import type {Module as VMModule} from 'node:vm';
import type {JestModule, ModuleRegistry} from './moduleTypes';

// Only expose ESM entries whose `namespace` is readable without throwing or
// exposing TDZ values: `unlinked`/`linking` throw `ERR_VM_MODULE_STATUS`,
// and anything short of `evaluated` keeps uninitialized (TDZ) bindings that
// throw `ReferenceError` on read - including `errored`, whose evaluation
// stopped partway. Node likewise drops a failed `require(esm)` entry from
// `require.cache`.
const isLiveEsm = (entry: JestModule | undefined): entry is VMModule => {
  if (!entry || entry instanceof Promise) return false;
  return (entry as VMModule).status === 'evaluated';
};

const notPermittedMethod = () => true;

class Isolation {
  readonly cjs: ModuleRegistry = new Map();
  readonly esm = new Map<string, JestModule>();
  readonly mock = new Map<string, unknown>();
  readonly moduleMock = new Map<string, JestModule>();

  clear(): void {
    this.cjs.clear();
    this.esm.clear();
    this.mock.clear();
    this.moduleMock.clear();
  }
}

export class ModuleRegistries {
  private readonly requireEsmResult: (module: VMModule) => unknown;

  private moduleRegistry: ModuleRegistry = new Map();
  private readonly internalModuleRegistry: ModuleRegistry = new Map();
  private esModuleRegistry = new Map<string, JestModule>();
  private mockRegistry = new Map<string, unknown>();
  private moduleMockRegistry = new Map<string, JestModule>();

  private isolation: Isolation | null = null;

  private readonly esmRequireCacheWrappers = new WeakMap<
    VMModule,
    NodeModule
  >();

  private requireCacheProxy: NodeJS.Require['cache'] | undefined;

  constructor(requireEsmResult: (module: VMModule) => unknown) {
    this.requireEsmResult = requireEsmResult;
  }

  // Reads cascade: isolated overlay first, fall back to main. Writes go to
  // the active overlay only. This lets `jest.isolateModules` inherit mock
  // instances the user set up outside (so `.mockImplementation(...)` on the
  // outer instance still applies to inner reads) while still allowing the
  // isolation block to install its own mocks that don't leak back out.
  getMock(moduleID: string): unknown {
    const fromIsolated = this.isolation?.mock.get(moduleID);
    if (fromIsolated !== undefined) return fromIsolated;
    return this.mockRegistry.get(moduleID);
  }
  setMock(moduleID: string, module: unknown): void {
    (this.isolation?.mock ?? this.mockRegistry).set(moduleID, module);
  }
  hasMock(moduleID: string): boolean {
    return (
      (this.isolation?.mock.has(moduleID) ?? false) ||
      this.mockRegistry.has(moduleID)
    );
  }

  // Same cascade as `getMock` above: an isolation block inherits the module
  // mocks instantiated outside it, but the instances it creates itself go to
  // the overlay and are dropped on exit.
  getModuleMock(moduleID: string): JestModule | undefined {
    return (
      this.isolation?.moduleMock.get(moduleID) ??
      this.moduleMockRegistry.get(moduleID)
    );
  }
  setModuleMock(moduleID: string, module: JestModule): void {
    (this.isolation?.moduleMock ?? this.moduleMockRegistry).set(
      moduleID,
      module,
    );
  }
  hasModuleMock(moduleID: string): boolean {
    return (
      (this.isolation?.moduleMock.has(moduleID) ?? false) ||
      this.moduleMockRegistry.has(moduleID)
    );
  }

  getActiveEsmRegistry(): Map<string, JestModule> {
    return this.isolation?.esm ?? this.esModuleRegistry;
  }

  getActiveCjsRegistry(): ModuleRegistry {
    return this.isolation?.cjs ?? this.moduleRegistry;
  }

  getInternalCjsRegistry(): ModuleRegistry {
    return this.internalModuleRegistry;
  }

  getActiveMockRegistry(): Map<string, unknown> {
    return this.isolation?.mock ?? this.mockRegistry;
  }

  private isIsolated(): boolean {
    return this.isolation !== null;
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
    this.isolation = new Isolation();
  }

  exitIsolated(): void {
    this.isolation?.clear();
    this.isolation = null;
  }

  // Loads `fn` against fresh CJS + mock registries, then restores the
  // originals. Used by `_generateMock` to keep automock loading from
  // polluting the real caches.
  withScratchRegistries<T>(fn: () => T): T {
    const originalMock = this.mockRegistry;
    const originalModule = this.moduleRegistry;
    const originalEsm = this.esModuleRegistry;
    const originalModuleMock = this.moduleMockRegistry;
    const originalIsolation = this.isolation;
    this.mockRegistry = new Map();
    this.moduleRegistry = new Map();
    this.esModuleRegistry = new Map();
    this.moduleMockRegistry = new Map();
    // Every accessor prefers the isolation overlay, so leaving it in place
    // would send the scratch load into the live isolated registry - the
    // pollution this exists to prevent. All four base maps are swapped too,
    // or an ESM target reached through `requireEsm` would write straight to
    // the long-lived registry once the overlay is out of the way.
    this.isolation = null;
    try {
      return fn();
    } finally {
      this.mockRegistry = originalMock;
      this.moduleRegistry = originalModule;
      this.esModuleRegistry = originalEsm;
      this.moduleMockRegistry = originalModuleMock;
      this.isolation = originalIsolation;
    }
  }

  wrapEsmForRequireCache(filename: string, esm: VMModule): NodeModule {
    const existing = this.esmRequireCacheWrappers.get(esm);
    if (existing) return existing;
    const dir = path.dirname(filename);
    const wrapper = {
      children: [],
      exports: this.requireEsmResult(esm),
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
          'require() on a require.cache ESM entry is not supported',
        );
      }) as unknown as NodeModule['require'],
    } satisfies NodeModule;
    this.esmRequireCacheWrappers.set(esm, wrapper);
    return wrapper;
  }

  // The ESM registry keys by serialized URL, but `require.cache` addresses
  // modules by path (Node keys its `require(esm)` entries the same way).
  // `pathToFileURL` percent-encodes `?`/`#`, so a path lookup can never reach
  // an entry that carries a query or fragment - those instances exist only
  // for `import`, exactly as in Node. Every non-path key is invisible: URL
  // strings, core specifiers, `data:` URIs and the registry's synthetic
  // entries never appear in Node's `require.cache` either.
  private getEsmEntryForRequireCache(key: string): JestModule | undefined {
    if (!path.isAbsolute(key)) {
      return undefined;
    }
    const registry = this.isolation?.esm ?? this.esModuleRegistry;
    return registry.get(pathToFileURL(key).href);
  }

  getEsmRequireCacheEntry(key: string): NodeModule | undefined {
    const entry = this.getEsmEntryForRequireCache(key);
    if (!isLiveEsm(entry)) return undefined;
    return this.wrapEsmForRequireCache(key, entry);
  }

  getRequireCacheProxy(): NodeJS.Require['cache'] {
    this.requireCacheProxy ??= new Proxy<NodeJS.Require['cache']>(
      Object.create(null),
      {
        defineProperty: notPermittedMethod,
        deleteProperty: notPermittedMethod,
        get: (_target, key) => {
          if (typeof key !== 'string') return undefined;
          return (
            ((this.isolation?.cjs ?? this.moduleRegistry).get(key) as
              NodeModule | undefined) ?? this.getEsmRequireCacheEntry(key)
          );
        },
        getOwnPropertyDescriptor() {
          return {configurable: true, enumerable: true};
        },
        has: (_target, key) => {
          if (typeof key !== 'string') return false;
          return (
            (this.isolation?.cjs ?? this.moduleRegistry).has(key) ||
            isLiveEsm(this.getEsmEntryForRequireCache(key))
          );
        },
        ownKeys: () => {
          const keys = new Set<string>(
            (this.isolation?.cjs ?? this.moduleRegistry).keys(),
          );
          for (const [key, entry] of this.isolation?.esm ??
            this.esModuleRegistry) {
            if (!isLiveEsm(entry)) continue;
            // Only file URLs become paths; core, data: and synthetic keys
            // are not path-addressable and stay invisible, as in Node.
            // `pathToFileURL` percent-encodes literal `?`/`#`, so their
            // presence always means a query or fragment - an instance a
            // path key cannot address.
            if (!key.startsWith('file://')) continue;
            if (key.includes('?') || key.includes('#')) continue;
            keys.add(fileURLToPath(key));
          }
          return [...keys];
        },
        set: notPermittedMethod,
      },
    );
    return this.requireCacheProxy;
  }

  clearForReset(): void {
    this.exitIsolated();
    this.mockRegistry.clear();
    this.moduleRegistry.clear();
    this.esModuleRegistry.clear();
    this.moduleMockRegistry.clear();
  }

  clear(): void {
    this.clearForReset();
    this.internalModuleRegistry.clear();
  }
}
