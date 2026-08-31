/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import {parse as parseCjs} from 'cjs-module-lexer';
import type {FileCache} from './FileCache';
import {CjsParseError} from './ModuleExecutor';
import type {Resolution} from './Resolution';
import type {TransformCache} from './TransformCache';
import {hasEsmSyntax} from './esmLexer';

export interface CjsExportsCacheOptions {
  resolution: Resolution;
  fileCache: FileCache;
  transformCache: TransformCache;
  loadNativeAddon: (from: string, modulePath: string) => unknown;
  loadCoreReexport: (from: string, coreName: string) => unknown;
}

// Computes (and caches) the named exports of a CJS module by static analysis
// with cjs-module-lexer, recursively walking `module.exports = require(...)`
// re-exports. Native (`.node`) addons and core-module re-exports can't be
// statically analysed, so they are loaded via the injected callbacks and the
// real export keys are read off the resulting object.
export class CjsExportsCache {
  private readonly cache = new Map<string, Set<string>>();
  private readonly resolution: Resolution;
  private readonly fileCache: FileCache;
  private readonly transformCache: TransformCache;
  private readonly loadNativeAddon: (
    from: string,
    modulePath: string,
  ) => unknown;
  private readonly loadCoreReexport: (
    from: string,
    coreName: string,
  ) => unknown;

  constructor(options: CjsExportsCacheOptions) {
    this.resolution = options.resolution;
    this.fileCache = options.fileCache;
    this.transformCache = options.transformCache;
    this.loadNativeAddon = options.loadNativeAddon;
    this.loadCoreReexport = options.loadCoreReexport;
  }

  // `from` is the module asking for the exports - propagated to the load
  // callbacks so user mocks (`jest.mock('./addon.node', factory)`) dispatch
  // against the real importer rather than an empty placeholder. The cache is
  // keyed by `modulePath` only (export keys don't depend on the importer);
  // `from` matters only for the cache-miss load.
  getExportsOf(from: string, modulePath: string): Set<string> {
    const cached = this.cache.get(modulePath);
    if (cached) return cached;

    if (path.extname(modulePath) === '.node') {
      const nativeModule = this.loadNativeAddon(from, modulePath);
      const namedExports = new Set(
        Object.keys(nativeModule as Record<string, unknown>),
      );
      this.cache.set(modulePath, namedExports);
      return namedExports;
    }

    const transformedCode =
      this.transformCache.getCachedSource(modulePath) ??
      this.fileCache.readFile(modulePath);

    let exports: Array<string>;
    let reexports: Array<string>;
    try {
      ({exports, reexports} = parseCjs(transformedCode));
    } catch (error) {
      if (error instanceof Error && hasEsmSyntax(transformedCode)) {
        throw new CjsParseError(error);
      }
      throw error;
    }
    const namedExports = new Set(exports);
    // Cache before walking re-exports so a cycle terminates: a re-entrant call
    // gets the set built so far instead of recursing forever. The set is
    // mutated in place, so the cached reference stays complete afterwards.
    this.cache.set(modulePath, namedExports);

    try {
      for (const reexport of reexports) {
        if (this.resolution.isCoreModule(reexport)) {
          const coreExports = this.loadCoreReexport(modulePath, reexport);
          if (coreExports !== null && typeof coreExports === 'object') {
            for (const key of Object.keys(
              coreExports as Record<string, unknown>,
            ))
              namedExports.add(key);
          }
        } else {
          const resolved = this.resolution.resolveCjs(modulePath, reexport);
          // A re-exported ES module has no CJS export list. Letting the parse
          // error escape would make the caller treat the *re-exporting* module
          // as ESM; its names still reach importers off the runtime exports
          // object.
          let reexportedNames: Set<string>;
          try {
            reexportedNames = this.getExportsOf(modulePath, resolved);
          } catch (error) {
            if (error instanceof CjsParseError) continue;
            throw error;
          }
          for (const key of reexportedNames) namedExports.add(key);
        }
      }
    } catch (error) {
      // Drop the entry seeded above: a walk that failed part-way must not
      // leave its partial export list memoized, or the next call returns it
      // as success and swallows this error.
      //
      // The rollback is deliberately shallow. Inside a re-export cycle, a
      // dependency that finished against this module's in-progress set keeps
      // its own entry, so looking that dependency up later yields a set built
      // from partial data instead of retrying. Reaching that needs a cycle
      // *and* a sibling re-export that fails to resolve, and callers execute
      // the module before asking for its exports - an unresolvable `require`
      // throws there first. Rolling back the whole traversal would mean
      // tracking every entry it seeded, which is more re-entrant bookkeeping
      // than the case warrants.
      this.cache.delete(modulePath);
      throw error;
    }

    return namedExports;
  }

  clear(): void {
    this.cache.clear();
  }
}
