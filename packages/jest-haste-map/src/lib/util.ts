/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {InternalHasteMap} from '../types';

export function copy<T extends Record<string, unknown>>(object: T): T {
  return Object.assign(Object.create(null), object);
}

export function copyMap<K, V>(input: Map<K, V>): Map<K, V> {
  return new Map(input);
}

export function createEmptyMap(): InternalHasteMap {
  return {
    clocks: new Map(),
    duplicates: new Map(),
    files: new Map(),
    map: new Map(),
    mocks: new Map(),
  };
}
