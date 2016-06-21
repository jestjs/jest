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

const JasmineFormatter = require('jest-util').JasmineFormatter;

import type {FailedAssertion} from 'types/TestResult';
import type {Jasmine} from 'types/Jasmine';
import type {Path} from 'types/Config';
import type {SnapshotState} from './SnapshotState';

type CompareResult = {
  pass: boolean,
  message: ?string,
};

module.exports = (
  filePath: Path,
  options: Object,
  jasmine: Jasmine,
  snapshotState: SnapshotState,
) => ({
  toMatchSnapshot: (util: any, customEquality: any) => {
    return {
      negativeCompare() {
        throw new Error(
          'Jest: `.not` can not be used with `.toMatchSnapshot()`.'
        );
      },
      compare(actual: any, expected: any): CompareResult {
        if (expected !== undefined) {
          throw new Error(
            'Jest: toMatchSnapshot() does not accept parameters.'
          );
        }

        const currentSpecName = snapshotState.currentSpecName;
        const snapshot = snapshotState.snapshot;

        const callCount = snapshotState.getCounter();
        snapshotState.incrementCounter();

        const key = currentSpecName + ' ' + callCount;
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
            const matcherName = 'toMatchSnapshot';
            const formatter = new JasmineFormatter(jasmine, {global: {}}, {});
            formatter.addDiffableMatcher(matcherName);

            message = formatter
              .formatMatchFailure(Object.assign(
                ({matcherName}: FailedAssertion),
                matches
              ))
              .replace(
                'toMatchSnapshot:',
                'toMatchSnapshot #' + (callCount + 1) + ':'
              );
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
  },
});
