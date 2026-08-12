/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {SourceMapCache} from './SourceMapCache';
import {nodeFileReader} from './nodeFileReader';
import type {SourceMapRegistry} from './types';

const cachesByRegistry = new WeakMap<SourceMapRegistry, SourceMapCache>();

// One cache per registry, so the stack trace formatter and `getCallsite` parse
// each `.map` file once between them.
export function getSourceMapCache(
  sourceMaps: SourceMapRegistry | null | undefined,
): SourceMapCache {
  if (sourceMaps == null) {
    return new SourceMapCache(null, nodeFileReader);
  }

  let cache = cachesByRegistry.get(sourceMaps);

  if (cache == null) {
    cache = new SourceMapCache(sourceMaps, nodeFileReader);
    cachesByRegistry.set(sourceMaps, cache);
  }

  return cache;
}
