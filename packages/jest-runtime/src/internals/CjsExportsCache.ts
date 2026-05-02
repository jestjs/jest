/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import {parse as parseCjs} from 'cjs-module-lexer';
import type {FileCache} from './FileCache';
import type {Resolution} from './Resolution';

// Computes (and caches) the named exports of a CJS module by static analysis
// with cjs-module-lexer, recursively walking `module.exports = require(...)`
// re-exports. Native (`.node`) addons and core-module re-exports can't be
// statically analysed, so they are loaded via the injected callbacks and the
// real export keys are read off the resulting object.
export class CjsExportsCache {
  private readonly cache = new Map<string, Set<string>>();
  private readonly resolution: Resolution;
  private readonly fileCache: FileCache;
  private readonly getTransformedCode: (
    modulePath: string,
  ) => string | undefined;
  private readonly requireModule: (from: string, moduleName: string) => unknown;
  private readonly requireModuleOrMock: (
    from: string,
    moduleName: string,
  ) => unknown;

  constructor(
    resolution: Resolution,
    fileCache: FileCache,
    getTransformedCode: (modulePath: string) => string | undefined,
    requireModule: (from: string, moduleName: string) => unknown,
    requireModuleOrMock: (from: string, moduleName: string) => unknown,
  ) {
    this.resolution = resolution;
    this.fileCache = fileCache;
    this.getTransformedCode = getTransformedCode;
    this.requireModule = requireModule;
    this.requireModuleOrMock = requireModuleOrMock;
  }

  getExportsOf(modulePath: string): Set<string> {
    const cached = this.cache.get(modulePath);
    if (cached) return cached;

    if (path.extname(modulePath) === '.node') {
      const nativeModule = this.requireModuleOrMock('', modulePath);
      const namedExports = new Set(
        Object.keys(nativeModule as Record<string, unknown>),
      );
      this.cache.set(modulePath, namedExports);
      return namedExports;
    }

    const transformedCode =
      this.getTransformedCode(modulePath) ??
      this.fileCache.readFile(modulePath);

    const {exports, reexports} = parseCjs(transformedCode);
    const namedExports = new Set(exports);

    for (const reexport of reexports) {
      if (this.resolution.isCoreModule(reexport)) {
        const coreExports = this.requireModule(modulePath, reexport);
        if (coreExports !== null && typeof coreExports === 'object') {
          for (const key of Object.keys(coreExports as Record<string, unknown>))
            namedExports.add(key);
        }
      } else {
        const resolved = this.resolution.resolveCjs(modulePath, reexport);
        for (const key of this.getExportsOf(resolved)) namedExports.add(key);
      }
    }

    this.cache.set(modulePath, namedExports);
    return namedExports;
  }

  clear(): void {
    this.cache.clear();
  }
}
