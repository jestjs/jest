/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO: replace with `util.getCallSites()`, whose `columnNumber` landed in
// Node 22.14 — the floor is still 18.
import callsites from 'callsites';
import {SourceMapCache} from './SourceMapCache';
import {addSourceMapConsumer} from './SourceMapSupport';
import {nodeFileReader} from './nodeFileReader';
import type {SourceMapRegistry} from './types';

const reportNothing = () => {
  // Broken maps stay quiet on this path: the formatter reports them when a
  // stack is formatted, which is when anyone can act on it.
};

// One cache per registry, so repeated lookups in a test file reuse it. Parsed
// maps are shared with the formatter through the process-lifetime parse cache.
const cachesByRegistry = new WeakMap<SourceMapRegistry, SourceMapCache>();
let nullCache: SourceMapCache | null = null;

function cacheFor(
  sourceMaps: SourceMapRegistry | null | undefined,
): SourceMapCache {
  if (sourceMaps == null) {
    nullCache ??= new SourceMapCache(null, nodeFileReader, reportNothing);

    return nullCache;
  }

  let cache = cachesByRegistry.get(sourceMaps);

  if (cache == null) {
    cache = new SourceMapCache(sourceMaps, nodeFileReader, reportNothing);
    cachesByRegistry.set(sourceMaps, cache);
  }

  return cache;
}

/**
 * One remapped `CallSite`, `level` frames above the caller.
 *
 * @deprecated Use `SourceMapSupport#getCallsite` instead.
 */
export default function getCallsite(
  level: number,
  sourceMaps?: SourceMapRegistry | null,
): callsites.CallSite {
  const levelAfterThisCall = level + 1;
  const stack = callsites()[levelAfterThisCall];
  const sourceMap = cacheFor(sourceMaps).get(stack.getFileName() ?? '');

  if (sourceMap != null) {
    addSourceMapConsumer(stack, sourceMap);
  }

  return stack;
}
