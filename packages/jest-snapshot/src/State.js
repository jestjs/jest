/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {Path} from 'types/Config';

const {forFile} = require('./SnapshotFile');
import type {SnapshotFile} from './SnapshotFile';

class SnapshotState {
  _counters: Map<string, number>;
  _index: number;
  added: number;
  matched: number;
  snapshot: SnapshotFile;
  unmatched: number;
  update: boolean;
  updated: number;

  constructor(testPath: Path, update: boolean) {
    this._counters = new Map();
    this._index = 0;
    this.added = 0;
    this.matched = 0;
    this.snapshot = forFile(testPath);
    this.unmatched = 0;
    this.update = update;
    this.updated = 0;
  }

  match(testName: string, received: any, key?: string) {
    this._counters.set(testName, (this._counters.get(testName) || 0) + 1);
    const count = Number(this._counters.get(testName));

    if (!key) {
      key = testName + ' ' + count;
    }

    const hasSnapshot = this.snapshot.has(key);

    if (
      !this.snapshot.fileExists() ||
      (hasSnapshot && this.update) ||
      !hasSnapshot
    ) {
      if (this.update) {
        if (!this.snapshot.matches(key, received).pass) {
          if (hasSnapshot) {
            this.updated++;
          } else {
            this.added++;
          }
          this.snapshot.add(key, received);
        } else {
          this.matched++;
        }
      } else {
        this.snapshot.add(key, received);
        this.added++;
      }

      return {pass: true};
    } else {
      const matches = this.snapshot.matches(key, received);
      const {pass} = matches;
      if (!pass) {
        this.unmatched++;
        return {
          count,
          pass: false,
          expected: matches.expected,
          actual: matches.actual,
        };
      } else {
        this.matched++;
        return {pass: true};
      }
    }
  }
}

module.exports = SnapshotState;
