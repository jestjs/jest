/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import * as fs from 'graceful-fs';
import Resolver from 'jest-resolve';

export const isWasm = (modulePath: string): boolean =>
  modulePath.endsWith('.wasm');

export class Resolution {
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

  // Resolves the manual mock module path from a (potentially aliased) module
  // name. Covers three shapes:
  //
  // A. Core module specifier i.e. ['fs', 'node:fs']:
  //    Normalize then check for a root manual mock '<rootDir>/__mocks__/'.
  //
  // B. Node module specifier i.e. ['jest', 'react']:
  //    Look for root manual mock.
  //
  // C. Relative/Absolute path:
  //    If the actual module file has a __mocks__ dir sitting immediately next
  //    to it, look to see if there is a manual mock for this file.
  //
  //      subDir1/my_module.js
  //      subDir1/__mocks__/my_module.js
  //      subDir2/my_module.js
  //      subDir2/__mocks__/my_module.js
  //
  //    Where some other module does a relative require into each of the
  //    respective subDir{1,2} directories and expects a manual mock
  //    corresponding to that particular my_module.js file.
  findManualMock(from: string, moduleName: string): string | null {
    if (this.isCoreModule(moduleName)) {
      return this.getCjsMockModule(
        from,
        this.normalizeCoreModuleSpecifier(moduleName),
      );
    }

    const rootMock = this.getCjsMockModule(from, moduleName);
    if (rootMock) return rootMock;

    const modulePath = this.resolveCjs(from, moduleName);
    const sibling = path.join(
      path.dirname(modulePath),
      '__mocks__',
      path.basename(modulePath),
    );
    return fs.existsSync(sibling) ? sibling : null;
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
