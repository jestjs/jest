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
import type {SnapshotState} from './SnapshotState';

const diff = require('jest-diff');
const {
  EXPECTED_COLOR,
  matcherHint,
  RECEIVED_COLOR,
} = require('jest-matcher-utils');

type CompareResult = {
  pass: boolean,
  message: ?string,
};

module.exports = (
  filePath: Path,
  options: Object,
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
          const expectedString = matches.expected.trim();
          const actualString = matches.actual.trim();
          const diffMessage = diff(
            expectedString,
            actualString,
            {
              aAnnotation: 'Snapshot',
              bAnnotation: 'Received',
            },
          );
          message =
            matcherHint('.toMatchSnapshot', 'value', '') + '\n\n' +
            `${RECEIVED_COLOR('Received value')} does not match ` +
            `${EXPECTED_COLOR('stored snapshot ' + count)}.\n\n` +
            (diffMessage || (
              RECEIVED_COLOR('- ' + expectedString) + '\n' +
              EXPECTED_COLOR('+ ' + actualString)
            ));
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
