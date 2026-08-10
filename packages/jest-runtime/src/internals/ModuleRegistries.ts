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

class Isolation {
  readonly cjs: ModuleRegistry = new Map();
  readonly esm = new Map<string, JestModule>();
  readonly mock = new Map<string, unknown>();

  clear(): void {
    this.cjs.clear();
    this.esm.clear();
    this.mock.clear();
  }
}

export class ModuleRegistries {
  private moduleRegistry: ModuleRegistry = new Map();
  private readonly internalModuleRegistry: ModuleRegistry = new Map();
  private readonly esModuleRegistry = new Map<string, JestModule>();
  private mockRegistry = new Map<string, unknown>();
  private readonly moduleMockRegistry = new Map<string, JestModule>();

  private isolation: Isolation | null = null;

  private readonly esmRequireCacheWrappers = new WeakMap<
    VMModule,
    NodeModule
  >();

  getCjs(modulePath: string): InitialModule | Module | JestModule | undefined {
    return (this.isolation?.cjs ?? this.moduleRegistry).get(modulePath);
  }
  setCjs(
    modulePath: string,
    module: InitialModule | Module | JestModule,
  ): void {
    (this.isolation?.cjs ?? this.moduleRegistry).set(modulePath, module);
  }
  hasCjs(modulePath: string): boolean {
    return (this.isolation?.cjs ?? this.moduleRegistry).has(modulePath);
  }
  deleteCjs(modulePath: string): void {
    (this.isolation?.cjs ?? this.moduleRegistry).delete(modulePath);
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

  getEsm(key: string): JestModule | undefined {
    return (this.isolation?.esm ?? this.esModuleRegistry).get(key);
  }
  setEsm(key: string, module: JestModule): void {
    (this.isolation?.esm ?? this.esModuleRegistry).set(key, module);
  }
  hasEsm(key: string): boolean {
    return (this.isolation?.esm ?? this.esModuleRegistry).has(key);
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

  getModuleMock(moduleID: string): JestModule | undefined {
    return this.moduleMockRegistry.get(moduleID);
  }
  setModuleMock(moduleID: string, module: JestModule): void {
    this.moduleMockRegistry.set(moduleID, module);
  }
  hasModuleMock(moduleID: string): boolean {
    return this.moduleMockRegistry.has(moduleID);
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

  isIsolated(): boolean {
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
          'require() on a require.cache ESM entry is not supported',
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
