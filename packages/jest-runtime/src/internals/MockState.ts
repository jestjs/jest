/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import type {Config} from '@jest/types';
import type {MockMetadata, ModuleMocker} from 'jest-mock';
import Resolver from 'jest-resolve';
import type {ModuleRegistries} from './ModuleRegistries';
import type {Resolution} from './Resolution';

const NODE_MODULES = `${path.sep}node_modules${path.sep}`;

const unmockRegExpCache = new WeakMap<Config.ProjectConfig, RegExp>();

const transitiveCacheKey = (from: string, moduleID: string) =>
  `${from}\0${moduleID}`;

export type MockDecision = {shouldMock: boolean; moduleID: string};

const NO_MOCK: MockDecision = Object.freeze({moduleID: '', shouldMock: false});

export class MockState {
  private readonly resolution: Resolution;
  private readonly rootDir: string;
  private readonly unmockList: RegExp | undefined;

  private shouldAutoMock: boolean;

  private readonly explicitCjsMock = new Map<string, boolean>();
  private readonly explicitEsmMock = new Map<string, boolean>();

  private readonly cjsFactories = new Map<string, () => unknown>();
  private readonly esmFactories = new Map<
    string,
    () => Promise<unknown> | unknown
  >();

  private readonly virtualCjsMocks = new Map<string, boolean>();
  private readonly virtualEsmMocks = new Map<string, boolean>();

  private readonly shouldMockCache = new Map<string, boolean>();
  private readonly shouldUnmockTransitiveDepsCache = new Map<string, boolean>();
  private readonly transitiveShouldMock = new Map<string, boolean>();

  private readonly mockMetaDataCache = new Map<string, MockMetadata<unknown>>();

  private readonly onGenerateMockCallbacks = new Set<
    (moduleName: string, moduleMock: unknown) => unknown
  >();

  constructor(resolution: Resolution, config: Config.ProjectConfig) {
    this.resolution = resolution;
    this.rootDir = config.rootDir;
    this.shouldAutoMock = config.automock;

    let unmock = unmockRegExpCache.get(config);
    if (!unmock && config.unmockedModulePathPatterns) {
      unmock = new RegExp(config.unmockedModulePathPatterns.join('|'));
      unmockRegExpCache.set(config, unmock);
    }
    this.unmockList = unmock;
  }

  shouldMockCjs(from: string, moduleName: string): MockDecision {
    if (this.noMockCanApply(this.explicitCjsMock)) {
      return NO_MOCK;
    }

    const moduleID = this.resolution.getCjsModuleId(
      this.virtualCjsMocks,
      from,
      moduleName,
    );
    return {
      moduleID,
      shouldMock: this.decideSync(from, moduleName, moduleID, 'cjs'),
    };
  }

  shouldMockEsmSync(from: string, moduleName: string): MockDecision {
    if (this.noMockCanApply(this.explicitEsmMock)) {
      return NO_MOCK;
    }

    const moduleID = this.resolution.getEsmModuleId(
      this.virtualEsmMocks,
      from,
      moduleName,
    );
    return {
      moduleID,
      shouldMock: this.decideSync(from, moduleName, moduleID, 'esm'),
    };
  }

  async shouldMockEsmAsync(
    from: string,
    moduleName: string,
  ): Promise<MockDecision> {
    if (this.noMockCanApply(this.explicitEsmMock)) {
      return NO_MOCK;
    }

    const moduleID = await this.resolution.getEsmModuleIdAsync(
      this.virtualEsmMocks,
      from,
      moduleName,
    );
    return {
      moduleID,
      shouldMock: await this.decideEsmAsync(from, moduleName, moduleID),
    };
  }

  // Deriving a module ID resolves the specifier and runs every
  // `moduleNameMapper` pattern, so the decision skips it when neither an
  // explicit mock nor automocking can make the answer anything but false.
  // Callers read `moduleID` only when `shouldMock` is true.
  private noMockCanApply(explicitMocks: Map<string, boolean>): boolean {
    return !this.shouldAutoMock && explicitMocks.size === 0;
  }

  private async decideEsmAsync(
    from: string,
    moduleName: string,
    moduleID: string,
  ): Promise<boolean> {
    const explicit = this.explicitEsmMock.get(moduleID);
    if (explicit !== undefined) return explicit;

    if (!this.shouldAutoMock || this.resolution.isCoreModule(moduleName)) {
      return false;
    }

    const key = transitiveCacheKey(from, moduleID);
    if (this.shouldUnmockTransitiveDepsCache.get(key)) {
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

    if (!this.shouldAutoMock || this.resolution.isCoreModule(moduleName)) {
      return false;
    }

    const key = transitiveCacheKey(from, moduleID);
    if (this.shouldUnmockTransitiveDepsCache.get(key)) {
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
    const moduleID = this.getModuleIdForMockRegistration(
      from,
      moduleName,
      'cjs',
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
    const moduleID = this.getModuleIdForMockRegistration(
      from,
      moduleName,
      'esm',
    );
    this.explicitEsmMock.set(moduleID, true);
    this.esmFactories.set(moduleID, factory);
  }

  // Registering a factory mock resolves the mocked name, so mocking a module
  // that does not exist on disk fails right here with a bare
  // "Cannot find module" - point at the `virtual` option, which is the
  // supported way to mock such a module.
  private getModuleIdForMockRegistration(
    from: string,
    moduleName: string,
    mode: 'cjs' | 'esm',
  ): string {
    try {
      return mode === 'cjs'
        ? this.resolution.getCjsModuleId(this.virtualCjsMocks, from, moduleName)
        : this.resolution.getEsmModuleId(
            this.virtualEsmMocks,
            from,
            moduleName,
          );
    } catch (error) {
      const moduleNotFound = Resolver.tryCastModuleNotFoundError(error);
      if (moduleNotFound) {
        moduleNotFound.hint =
          '\n\nTo mock a module that does not exist on disk, pass `{virtual: true}` in the mock options. See https://jestjs.io/docs/jest-object#jestmockmodulename-factory-options';
        moduleNotFound.buildMessage(this.rootDir);
      }
      throw error;
    }
  }

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

  markExplicitCjsMock(from: string, moduleName: string): void {
    const moduleID = this.resolution.getCjsModuleId(
      this.virtualCjsMocks,
      from,
      moduleName,
    );
    this.explicitCjsMock.set(moduleID, true);
  }

  addOnGenerateMock<T>(
    callback: (moduleName: string, moduleMock: T) => T,
  ): void {
    this.onGenerateMockCallbacks.add(
      callback as (moduleName: string, moduleMock: unknown) => unknown,
    );
  }

  getCjsModuleId(from: string, moduleName?: string): string {
    return this.resolution.getCjsModuleId(
      this.virtualCjsMocks,
      from,
      moduleName,
    );
  }

  isExplicitlyUnmocked(moduleID: string): boolean {
    return this.explicitCjsMock.get(moduleID) === false;
  }

  getCjsFactory(moduleID: string): (() => unknown) | undefined {
    return this.cjsFactories.get(moduleID);
  }

  getEsmFactory(
    moduleID: string,
  ): (() => Promise<unknown> | unknown) | undefined {
    return this.esmFactories.get(moduleID);
  }

  markTransitive(moduleID: string, value: boolean): void {
    this.transitiveShouldMock.set(moduleID, value);
  }

  hasMockMetadata(modulePath: string): boolean {
    return this.mockMetaDataCache.has(modulePath);
  }
  getMockMetadata(modulePath: string): MockMetadata<unknown> | undefined {
    return this.mockMetaDataCache.get(modulePath);
  }
  setMockMetadata(modulePath: string, metadata: MockMetadata<unknown>): void {
    this.mockMetaDataCache.set(modulePath, metadata);
  }
  deleteMockMetadata(modulePath: string): void {
    this.mockMetaDataCache.delete(modulePath);
  }

  notifyMockGenerated<T>(moduleName: string, moduleMock: T): T {
    let result: unknown = moduleMock;
    for (const callback of this.onGenerateMockCallbacks) {
      result = callback(moduleName, result);
    }
    return result as T;
  }

  // `resetModules` does not touch mock state - explicit mocks, factories, and
  // virtual marks survive a reset. Only `teardown` drops everything.
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

export interface GenerateMockOptions {
  resolution: Resolution;
  mockState: MockState;
  moduleMocker: ModuleMocker;
  registries: ModuleRegistries;
  // The real-module require used to populate metadata. Wired to
  // `CjsLoader.requireModule` at construction time. Wraps in scratch
  // registries to avoid polluting the real module/mock caches.
  requireModule: (from: string, moduleName: string) => unknown;
}

export function generateMock<T>(
  from: string,
  moduleName: string,
  options: GenerateMockOptions,
): T {
  const {resolution, mockState, moduleMocker, registries, requireModule} =
    options;

  const modulePath =
    resolution.resolveCjsStub(from, moduleName) ||
    resolution.resolveCjs(from, moduleName);

  if (!mockState.hasMockMetadata(modulePath)) {
    // This allows us to handle circular dependencies while generating an
    // automock
    mockState.setMockMetadata(modulePath, moduleMocker.getMetadata({}) || {});

    // In order to avoid it being possible for automocking to potentially
    // cause side-effects within the module environment, we need to execute
    // the module in isolation. This could cause issues if the module being
    // mocked has calls into side-effectful APIs on another module.
    const moduleExports = registries.withScratchRegistries(() =>
      requireModule(from, moduleName),
    );

    const mockMetadata = moduleMocker.getMetadata(moduleExports);
    if (mockMetadata == null) {
      throw new Error(
        `Failed to get mock metadata: ${modulePath}\n\n` +
          'See: https://jestjs.io/docs/manual-mocks#content',
      );
    }
    mockState.setMockMetadata(modulePath, mockMetadata);
  }

  const moduleMock = moduleMocker.generateFromMetadata<T>(
    mockState.getMockMetadata(modulePath)! as MockMetadata<T>,
  );
  return mockState.notifyMockGenerated(modulePath, moduleMock);
}
