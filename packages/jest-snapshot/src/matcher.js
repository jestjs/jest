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

import type {Jasmine} from 'types/Jasmine';
import type {Path} from 'types/Config';
import type {SnapshotState} from './SnapshotState';

const diff = require('jest-diff');

type CompareResult = {
  pass: boolean,
  message: ?string,
};

module.exports = (
  filePath: Path,
  options: Object,
  jasmine: Jasmine,
  snapshotState: SnapshotState,
) => (util: any, customEquality: any) => {
  return {
    negativeCompare() {
      throw new Error(
        'Jest: `.not` can not be used with `.toMatchSnapshot()`.',
      );
    },
    compare(actual: any, expected: any): CompareResult {
      if (expected !== undefined) {
        throw new Error(
          'Jest: toMatchSnapshot() does not accept parameters.',
        );
      }

      const snapshot = snapshotState.snapshot;
      const count = snapshotState.incrementCounter();
      const key = snapshotState.getSpecName() + ' ' + count;
      const hasSnapshot = snapshot.has(key);
      let pass = false;
      let message;

      if (
        !snapshot.fileExists() ||
        (hasSnapshot && options.updateSnapshot) ||
        !hasSnapshot
      ) {
        if (options.updateSnapshot) {
          if (!snapshot.matches(key, actual).pass) {
            if (hasSnapshot) {
              snapshotState.updated++;
            } else {
              snapshotState.added++;
            }
            snapshot.add(key, actual);
          } else {
            snapshotState.matched++;
          }
        } else {
          snapshot.add(key, actual);
          snapshotState.added++;
        }
        pass = true;
      } else {
        const matches = snapshot.matches(key, actual);
        pass = matches.pass;
        if (!pass) {
          snapshotState.unmatched++;
          message =
            `expected value to match snapshot ${count}\n` +
            diff(matches.expected.trim(), matches.actual.trim());
        } else {
          snapshotState.matched++;
        }
      }

      return {
        pass,
        message,
      };
    },
  };
};
