/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import type {Config} from '@jest/types';
import type {MockMetadata} from 'jest-mock';
import type Resolution from './Resolution';

const NODE_MODULES = `${path.sep}node_modules${path.sep}`;

const unmockRegExpCache = new WeakMap<Config.ProjectConfig, RegExp>();

// `from` + a NUL byte that can't appear in a path → unique per (from, moduleID).
const transitiveCacheKey = (from: string, moduleID: string) =>
  `${from}\0${moduleID}`;

// Owns every piece of mock-decision and mock-registration state. Three entry
// points (`shouldMockCjs`, `shouldMockEsmSync`, `shouldMockEsmAsync`) consolidate
// what used to be three near-identical mirrors on `Runtime`. The decision
// diamond - explicit > on-resolve-error > unmock list > transitive - is shared
// across all three; only the resolver methods (sync CJS / sync ESM / async ESM)
// differ.
export default class MockState {
  private readonly resolution: Resolution;
  private readonly unmockList: RegExp | undefined;

  private shouldAutoMock: boolean;

  // Module-ID-keyed: explicit `jest.mock(name)` and `jest.unmock(name)`.
  private readonly explicitCjsMock = new Map<string, boolean>();
  private readonly explicitEsmMock = new Map<string, boolean>();

  // Module-ID-keyed: `jest.mock(name, factory)` / `jest.unstable_mockModule`.
  private readonly cjsFactories = new Map<string, () => unknown>();
  private readonly esmFactories = new Map<
    string,
    () => Promise<unknown> | unknown
  >();

  // Path-keyed: `jest.mock(name, factory, {virtual: true})`.
  private readonly virtualCjsMocks = new Map<string, boolean>();
  private readonly virtualEsmMocks = new Map<string, boolean>();

  // Module-ID-keyed: cached should-mock decisions and `deepUnmock` markers.
  private readonly shouldMockCache = new Map<string, boolean>();
  private readonly shouldUnmockTransitiveDepsCache = new Map<string, boolean>();
  private readonly transitiveShouldMock = new Map<string, boolean>();

  // Path-keyed: `_moduleMocker.getMetadata(...)` results, used by `_generateMock`.
  private readonly mockMetaDataCache = new Map<string, MockMetadata<unknown>>();

  private readonly onGenerateMockCallbacks = new Set<
    // The user-supplied callbacks aren't statically typed; jest-mock's API
    // takes an `<T>(name: string, mock: T) => T` shape.
    (moduleName: string, moduleMock: unknown) => unknown
  >();

  constructor(resolution: Resolution, config: Config.ProjectConfig) {
    this.resolution = resolution;
    this.shouldAutoMock = config.automock;

    let unmock = unmockRegExpCache.get(config);
    if (!unmock && config.unmockedModulePathPatterns) {
      unmock = new RegExp(config.unmockedModulePathPatterns.join('|'));
      unmockRegExpCache.set(config, unmock);
    }
    this.unmockList = unmock;
  }

  // ---- decision predicates ----

  shouldMockCjs(from: string, moduleName: string): boolean {
    const moduleID = this.resolution.getCjsModuleId(
      this.virtualCjsMocks,
      from,
      moduleName,
    );
    return this.decideSync(from, moduleName, moduleID, 'cjs');
  }

  shouldMockEsmSync(from: string, moduleName: string): boolean {
    const moduleID = this.resolution.getEsmModuleId(
      this.virtualEsmMocks,
      from,
      moduleName,
    );
    return this.decideSync(from, moduleName, moduleID, 'esm');
  }

  async shouldMockEsmAsync(from: string, moduleName: string): Promise<boolean> {
    const moduleID = await this.resolution.getEsmModuleIdAsync(
      this.virtualEsmMocks,
      from,
      moduleName,
    );

    const explicit = this.explicitEsmMock.get(moduleID);
    if (explicit !== undefined) return explicit;

    const key = transitiveCacheKey(from, moduleID);
    if (
      !this.shouldAutoMock ||
      this.resolution.isCoreModule(moduleName) ||
      this.shouldUnmockTransitiveDepsCache.get(key)
    ) {
      return false;
    }

    const cached = this.shouldMockCache.get(moduleID);
    if (cached !== undefined) return cached;

    let modulePath: string;
    try {
      modulePath = await this.resolution.resolveEsmAsync(from, moduleName);
    } catch (error) {
      const manualMock = await this.resolution.getEsmMockModuleAsync(
        from,
        moduleName,
      );
      if (manualMock) {
        this.shouldMockCache.set(moduleID, true);
        return true;
      }
      throw error;
    }

    if (this.unmockList?.test(modulePath)) {
      this.shouldMockCache.set(moduleID, false);
      return false;
    }

    const currentModuleID = await this.resolution.getEsmModuleIdAsync(
      this.virtualEsmMocks,
      from,
    );
    return this.applyTransitive(
      moduleID,
      currentModuleID,
      modulePath,
      from,
      key,
      this.explicitEsmMock,
    );
  }

  // Shared body for `shouldMockCjs` / `shouldMockEsmSync`. Mode picks the
  // correct virtualMocks map, resolver, and explicit map.
  private decideSync(
    from: string,
    moduleName: string,
    moduleID: string,
    mode: 'cjs' | 'esm',
  ): boolean {
    const explicitMap =
      mode === 'cjs' ? this.explicitCjsMock : this.explicitEsmMock;
    const explicit = explicitMap.get(moduleID);
    if (explicit !== undefined) return explicit;

    const key = transitiveCacheKey(from, moduleID);
    if (
      !this.shouldAutoMock ||
      this.resolution.isCoreModule(moduleName) ||
      this.shouldUnmockTransitiveDepsCache.get(key)
    ) {
      return false;
    }

    const cached = this.shouldMockCache.get(moduleID);
    if (cached !== undefined) return cached;

    let modulePath: string;
    try {
      modulePath =
        mode === 'cjs'
          ? this.resolution.resolveCjs(from, moduleName)
          : this.resolution.resolveEsm(from, moduleName);
    } catch (error) {
      const manualMock =
        mode === 'cjs'
          ? this.resolution.getCjsMockModule(from, moduleName)
          : this.resolution.getEsmMockModule(from, moduleName);
      if (manualMock) {
        this.shouldMockCache.set(moduleID, true);
        return true;
      }
      throw error;
    }

    if (this.unmockList?.test(modulePath)) {
      this.shouldMockCache.set(moduleID, false);
      return false;
    }

    const currentModuleID =
      mode === 'cjs'
        ? this.resolution.getCjsModuleId(this.virtualCjsMocks, from)
        : this.resolution.getEsmModuleId(this.virtualEsmMocks, from);

    return this.applyTransitive(
      moduleID,
      currentModuleID,
      modulePath,
      from,
      key,
      explicitMap,
    );
  }

  // The transitive-unmock tail of the diamond. Shared between sync and async
  // entry points - identical logic, both already have `currentModuleID`.
  private applyTransitive(
    moduleID: string,
    currentModuleID: string,
    modulePath: string,
    from: string,
    key: string,
    explicitMap: Map<string, boolean>,
  ): boolean {
    if (
      this.transitiveShouldMock.get(currentModuleID) === false ||
      (from.includes(NODE_MODULES) &&
        modulePath.includes(NODE_MODULES) &&
        ((this.unmockList && this.unmockList.test(from)) ||
          explicitMap.get(currentModuleID) === false))
    ) {
      this.transitiveShouldMock.set(moduleID, false);
      this.shouldUnmockTransitiveDepsCache.set(key, true);
      return false;
    }
    this.shouldMockCache.set(moduleID, true);
    return true;
  }

  // ---- explicit registration ----

  setMock(
    from: string,
    moduleName: string,
    factory: () => unknown,
    options?: {virtual?: boolean},
  ): void {
    if (options?.virtual) {
      const mockPath = this.resolution.getModulePath(from, moduleName);
      this.virtualCjsMocks.set(mockPath, true);
    }
    const moduleID = this.resolution.getCjsModuleId(
      this.virtualCjsMocks,
      from,
      moduleName,
    );
    this.explicitCjsMock.set(moduleID, true);
    this.cjsFactories.set(moduleID, factory);
  }

  setModuleMock(
    from: string,
    moduleName: string,
    factory: () => Promise<unknown> | unknown,
    options?: {virtual?: boolean},
  ): void {
    if (options?.virtual) {
      const mockPath = this.resolution.getModulePath(from, moduleName);
      this.virtualEsmMocks.set(mockPath, true);
    }
    const moduleID = this.resolution.getEsmModuleId(
      this.virtualEsmMocks,
      from,
      moduleName,
    );
    this.explicitEsmMock.set(moduleID, true);
    this.esmFactories.set(moduleID, factory);
  }

  // ---- jest-object closure surface ----

  disableAutomock(): void {
    this.shouldAutoMock = false;
  }

  enableAutomock(): void {
    this.shouldAutoMock = true;
  }

  unmockCjs(from: string, moduleName: string): void {
    const moduleID = this.resolution.getCjsModuleId(
      this.virtualCjsMocks,
      from,
      moduleName,
    );
    this.explicitCjsMock.set(moduleID, false);
  }

  unmockEsm(from: string, moduleName: string): void {
    const moduleID = this.resolution.getEsmModuleId(
      this.virtualEsmMocks,
      from,
      moduleName,
    );
    this.explicitEsmMock.set(moduleID, false);
  }

  deepUnmock(from: string, moduleName: string): void {
    const moduleID = this.resolution.getCjsModuleId(
      this.virtualCjsMocks,
      from,
      moduleName,
    );
    this.explicitCjsMock.set(moduleID, false);
    this.transitiveShouldMock.set(moduleID, false);
  }

  // `jest.mock(name)` no-factory branch.
  markExplicitCjsMock(from: string, moduleName: string): void {
    const moduleID = this.resolution.getCjsModuleId(
      this.virtualCjsMocks,
      from,
      moduleName,
    );
    this.explicitCjsMock.set(moduleID, true);
  }

  addOnGenerateMock(
    callback: (moduleName: string, moduleMock: unknown) => unknown,
  ): void {
    this.onGenerateMockCallbacks.add(callback);
  }

  // Module-ID lookups using the right virtual-mocks map. Callers (require /
  // requireMock paths) need a moduleID to look up factories and explicit
  // marks; those `getModuleID` calls always feed in the same virtual-mocks
  // map MockState already owns.
  getCjsModuleId(from: string, moduleName?: string): string {
    return this.resolution.getCjsModuleId(
      this.virtualCjsMocks,
      from,
      moduleName,
    );
  }
  getEsmModuleId(from: string, moduleName?: string): string {
    return this.resolution.getEsmModuleId(
      this.virtualEsmMocks,
      from,
      moduleName,
    );
  }
  getEsmModuleIdAsync(from: string, moduleName?: string): Promise<string> {
    return this.resolution.getEsmModuleIdAsync(
      this.virtualEsmMocks,
      from,
      moduleName,
    );
  }

  // ---- read accessors ----

  // True if the user *explicitly* set a non-mocked decision (`jest.unmock`).
  isExplicitlyUnmocked(moduleID: string): boolean {
    return this.explicitCjsMock.get(moduleID) === false;
  }

  hasCjsFactory(moduleID: string): boolean {
    return this.cjsFactories.has(moduleID);
  }
  getCjsFactory(moduleID: string): (() => unknown) | undefined {
    return this.cjsFactories.get(moduleID);
  }

  hasEsmFactory(moduleID: string): boolean {
    return this.esmFactories.has(moduleID);
  }
  getEsmFactory(
    moduleID: string,
  ): (() => Promise<unknown> | unknown) | undefined {
    return this.esmFactories.get(moduleID);
  }

  // Used by the constructor's automock-setupFiles path on Runtime to seed
  // transitiveShouldMock for setup scripts under node_modules.
  markTransitive(moduleID: string, value: boolean): void {
    this.transitiveShouldMock.set(moduleID, value);
  }

  // ---- mock-metadata cache (used by `_generateMock`) ----

  hasMockMetadata(modulePath: string): boolean {
    return this.mockMetaDataCache.has(modulePath);
  }
  getMockMetadata(modulePath: string): MockMetadata<unknown> | undefined {
    return this.mockMetaDataCache.get(modulePath);
  }
  setMockMetadata(modulePath: string, metadata: MockMetadata<unknown>): void {
    this.mockMetaDataCache.set(modulePath, metadata);
  }

  // Runs every registered `onGenerateMock` callback over the supplied mock,
  // threading the result through. Called by `_generateMock` after the
  // module mocker produces the initial mock value.
  notifyMockGenerated<T>(moduleName: string, moduleMock: T): T {
    let result: unknown = moduleMock;
    for (const cb of this.onGenerateMockCallbacks) {
      result = cb(moduleName, result);
    }
    return result as T;
  }

  // `teardown`: drop everything. `resetModules` does *not* touch mock state -
  // explicit mocks, factories, and virtual marks survive a reset. Decision
  // caches (`shouldMockCache`, `shouldUnmockTransitiveDepsCache`,
  // `transitiveShouldMock`) also survive because explicit/factory updates
  // either override them at predicate entry or don't invalidate them.
  clear(): void {
    this.cjsFactories.clear();
    this.esmFactories.clear();
    this.mockMetaDataCache.clear();
    this.shouldMockCache.clear();
    this.shouldUnmockTransitiveDepsCache.clear();
    this.explicitCjsMock.clear();
    this.explicitEsmMock.clear();
    this.transitiveShouldMock.clear();
    this.virtualCjsMocks.clear();
    this.virtualEsmMocks.clear();
    this.onGenerateMockCallbacks.clear();
  }
}
