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
const processSnapshot = require('./processSnapshot');

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
    compare(actual: any, jasmineExpectedArgument: any): CompareResult {
      if (jasmineExpectedArgument !== undefined) {
        throw new Error(
          'Jest: toMatchSnapshot() does not accept parameters.',
        );
      }

      const count = snapshotState.incrementCounter();
      const key = snapshotState.getSpecName() + ' ' + count;
      const {pass, expected} = processSnapshot(
        snapshotState,
        key,
        actual,
        options,
      );

      let message;
      if (!pass && expected) {
        message =
          `Received value does not match the stored snapshot ${count}.\n\n` +
          diff(
            expected.trim(),
            actual.trim(),
            {
              aAnnotation: 'Snapshot',
              bAnnotation: 'Received',
            },
          );
      }

      return {
        pass,
        message,
      };
    },
  };
};
