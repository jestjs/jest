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
    try {
      return deserialize(readFileSync(this._cachePath));
    } catch {
      return createEmptyMap();
    }
  }

  persist(hasteMap: InternalHasteMap): void {
    writeFileSync(this._cachePath, serialize(hasteMap));
  }
}
