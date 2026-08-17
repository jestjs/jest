/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {deserialize, serialize} from 'node:v8';
import {readFileSync, writeFileSync} from 'graceful-fs';
import type {InternalHasteMap} from '../types';
import {createEmptyMap} from './util';

export class CacheManager {
  private readonly _cachePath: string;

  constructor(cachePath: string) {
    this._cachePath = cachePath;
  }

  get path(): string {
    return this._cachePath;
  }

  read(): InternalHasteMap {
    let hasteMap: InternalHasteMap;
    try {
      hasteMap = deserialize(readFileSync(this._cachePath));
    } catch {
      return createEmptyMap();
    }
    // A cache written before `mockDuplicates` existed has no record of which
    // files claim which mock name. Defaulting it to empty would read as "no
    // duplicates anywhere" and leave watch mode unable to recover one, so treat
    // it as a miss and let the crawl derive the claims again.
    if (hasteMap.mockDuplicates == null) {
      return createEmptyMap();
    }
    return hasteMap;
  }

  persist(hasteMap: InternalHasteMap): void {
    writeFileSync(this._cachePath, serialize(hasteMap));
  }
}
