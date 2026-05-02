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

// Only expose ESM entries whose `namespace` is readable without throwing or
// exposing TDZ values: `unlinked`/`linking` throw `ERR_VM_MODULE_STATUS`, and
// a `linked` SourceTextModule's namespace properties are in TDZ until
// evaluate runs (reading them throws `ReferenceError`).
const isLiveEsm = (entry: JestModule | undefined): entry is VMModule => {
  if (!entry || entry instanceof Promise) return false;
  const status = (entry as VMModule).status;
  return status === 'evaluated' || status === 'errored';
};

const notPermittedMethod = () => true;

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

  getCjs(modulePath: string): InitialModule | Module | JestModule | undefined {
    return (this.isolatedModuleRegistry ?? this.moduleRegistry).get(modulePath);
  }
  setCjs(
    modulePath: string,
    module: InitialModule | Module | JestModule,
  ): void {
    (this.isolatedModuleRegistry ?? this.moduleRegistry).set(
      modulePath,
      module,
    );
  }
  hasCjs(modulePath: string): boolean {
    return (this.isolatedModuleRegistry ?? this.moduleRegistry).has(modulePath);
  }
  deleteCjs(modulePath: string): void {
    (this.isolatedModuleRegistry ?? this.moduleRegistry).delete(modulePath);
  }

  getInternalCjs(
    modulePath: string,
  ): InitialModule | Module | JestModule | undefined {
    return this.internalModuleRegistry.get(modulePath);
  }
  setInternalCjs(
    modulePath: string,
    module: InitialModule | Module | JestModule,
  ): void {
    this.internalModuleRegistry.set(modulePath, module);
  }
  hasInternalCjs(modulePath: string): boolean {
    return this.internalModuleRegistry.has(modulePath);
  }

  getEsm(key: string): InitialModule | Module | JestModule | undefined {
    return (this.isolatedModuleRegistry ?? this.esModuleRegistry).get(key);
  }
  setEsm(key: string, module: JestModule): void {
    (this.isolatedModuleRegistry ?? this.esModuleRegistry).set(key, module);
  }
  hasEsm(key: string): boolean {
    return (this.isolatedModuleRegistry ?? this.esModuleRegistry).has(key);
  }

  getMock(moduleID: string): unknown {
    return (this.isolatedMockRegistry ?? this.mockRegistry).get(moduleID);
  }
  setMock(moduleID: string, module: unknown): void {
    (this.isolatedMockRegistry ?? this.mockRegistry).set(moduleID, module);
  }
  hasMock(moduleID: string): boolean {
    return (this.isolatedMockRegistry ?? this.mockRegistry).has(moduleID);
  }

  getModuleMock(moduleID: string): JestModule | undefined {
    return this.moduleMockRegistry.get(moduleID);
  }
  setModuleMock(moduleID: string, module: JestModule): void {
    this.moduleMockRegistry.set(moduleID, module);
  }
  hasModuleMock(moduleID: string): boolean {
    return this.moduleMockRegistry.has(moduleID);
  }

  // The isolation overlay is shared with CJS, so when used in isolation the
  // map's value type widens to the union; the ESM walker only ever inserts
  // and reads JestModule values keyed by ESM cache keys.
  getActiveEsmRegistry(): Map<string, JestModule> {
    return (this.isolatedModuleRegistry ?? this.esModuleRegistry) as Map<
      string,
      JestModule
    >;
  }

  getActiveCjsRegistry(internal: boolean): ModuleRegistry {
    if (internal) return this.internalModuleRegistry;
    return this.isolatedModuleRegistry ?? this.moduleRegistry;
  }

  getActiveMockRegistry(): Map<string, unknown> {
    return this.isolatedMockRegistry ?? this.mockRegistry;
  }

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

  // Loads `fn` against fresh CJS + mock registries, then restores the
  // originals. Used by `_generateMock` to keep automock loading from
  // polluting the real caches.
  withScratchRegistries<T>(fn: () => T): T {
    const originalMock = this.mockRegistry;
    const originalModule = this.moduleRegistry;
    this.mockRegistry = new Map();
    this.moduleRegistry = new Map();
    try {
      return fn();
    } finally {
      this.mockRegistry = originalMock;
      this.moduleRegistry = originalModule;
    }
  }

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
