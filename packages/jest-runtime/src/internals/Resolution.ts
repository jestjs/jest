/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Resolver from 'jest-resolve';

export const isWasm = (modulePath: string): boolean =>
  modulePath.endsWith('.wasm');

export default class Resolution {
  private readonly resolver: Resolver;
  private readonly cjsConditions: ReadonlyArray<string>;
  private readonly esmConditions: ReadonlyArray<string>;
  private readonly extensionsToTreatAsEsm: ReadonlyArray<string>;
  private readonly cjsCache = new Map<string, string>();
  private readonly esmCache = new Map<string, string>();

  constructor(
    resolver: Resolver,
    envExportConditions: ReadonlyArray<string>,
    extensionsToTreatAsEsm: ReadonlyArray<string>,
  ) {
    this.resolver = resolver;
    this.cjsConditions = [
      ...new Set(['require', 'node', 'default', ...envExportConditions]),
    ];
    this.esmConditions = [
      ...new Set(['import', 'default', ...envExportConditions]),
    ];
    this.extensionsToTreatAsEsm = extensionsToTreatAsEsm;
  }

  shouldLoadAsEsm(modulePath: string): boolean {
    return (
      isWasm(modulePath) ||
      Resolver.unstable_shouldLoadAsEsm(
        modulePath,
        this.extensionsToTreatAsEsm as Array<string>,
      )
    );
  }

  resolveCjs(from: string, to: string | undefined): string {
    if (!to) return from;
    return this.resolveCached(from, to, this.cjsCache, this.cjsConditions);
  }

  resolveEsm(from: string, to: string | undefined): string {
    if (!to) return from;
    return this.resolveCached(from, to, this.esmCache, this.esmConditions);
  }

  resolveEsmAsync(from: string, to: string | undefined): Promise<string> {
    if (!to) return Promise.resolve(from);
    return this.resolver.resolveModuleAsync(from, to, {
      conditions: this.esmConditions,
    });
  }

  getCjsModuleId(
    virtualMocks: Map<string, boolean>,
    from: string,
    moduleName?: string,
  ): string {
    return this.resolver.getModuleID(virtualMocks, from, moduleName, {
      conditions: this.cjsConditions,
    });
  }

  getEsmModuleId(
    virtualMocks: Map<string, boolean>,
    from: string,
    moduleName?: string,
  ): string {
    return this.resolver.getModuleID(virtualMocks, from, moduleName, {
      conditions: this.esmConditions,
    });
  }

  getEsmModuleIdAsync(
    virtualMocks: Map<string, boolean>,
    from: string,
    moduleName?: string,
  ): Promise<string> {
    return this.resolver.getModuleIDAsync(virtualMocks, from, moduleName, {
      conditions: this.esmConditions,
    });
  }

  getCjsMockModule(from: string, moduleName: string): string | null {
    return this.resolver.getMockModule(from, moduleName, {
      conditions: this.cjsConditions,
    });
  }

  getEsmMockModule(from: string, moduleName: string): string | null {
    return this.resolver.getMockModule(from, moduleName, {
      conditions: this.esmConditions,
    });
  }

  getEsmMockModuleAsync(
    from: string,
    moduleName: string,
  ): Promise<string | null> {
    return this.resolver.getMockModuleAsync(from, moduleName, {
      conditions: this.esmConditions,
    });
  }

  resolveCjsStub(from: string, moduleName: string): string | null {
    return this.resolver.resolveStubModuleName(from, moduleName, {
      conditions: this.cjsConditions,
    });
  }

  getModulePaths(from: string): Array<string> {
    return this.resolver.getModulePaths(from);
  }

  getGlobalPaths(moduleName?: string): Array<string> {
    return this.resolver.getGlobalPaths(moduleName);
  }

  isCoreModule(name: string): boolean {
    return this.resolver.isCoreModule(name);
  }

  normalizeCoreModuleSpecifier(name: string): string {
    return this.resolver.normalizeCoreModuleSpecifier(name);
  }

  getModule(name: string): string | null {
    return this.resolver.getModule(name);
  }

  getModulePath(from: string, moduleName: string): string {
    return this.resolver.getModulePath(from, moduleName);
  }

  canResolveSync(): boolean {
    return this.resolver.canResolveSync();
  }

  resolveCjsFromDirIfExists(
    dir: string,
    name: string,
    paths?: Array<string>,
  ): string | null {
    return this.resolver.resolveModuleFromDirIfExists(dir, name, {
      conditions: this.cjsConditions,
      paths,
    });
  }

  clear(): void {
    this.cjsCache.clear();
    this.esmCache.clear();
  }

  private resolveCached(
    from: string,
    to: string,
    cache: Map<string, string>,
    conditions: ReadonlyArray<string>,
  ): string {
    const key = `${from}\0${to}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const resolved = this.resolver.resolveModule(from, to, {conditions});
    cache.set(key, resolved);
    return resolved;
  }
}
