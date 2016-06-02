/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const JasmineFormatter = require('jest-util').JasmineFormatter;

module.exports = (filePath, options, jasmine, snapshotState) => ({
  toMatchSnapshot: (util, customEquality) => {
    return {
      negativeCompare() {
        throw new Error(
          'Jest: `.not` can not be used with `.toMatchSnapshot()`.'
        );
      },
      compare(actual, expected) {
        if (expected !== undefined) {
          throw new Error(
            'Jest: toMatchSnapshot() does not accept parameters.'
          );
        }

        const currentSpecName = snapshotState.currentSpecName;
        const snapshot = snapshotState.snapshot;

        const callCount = snapshotState.getCounter();
        snapshotState.incrementCounter();

        let pass = false;
        let message;
        const key = currentSpecName + ' ' + callCount;
        if (
          !snapshot.fileExists() ||
          (snapshot.has(key) && options.updateSnapshot) ||
          !snapshot.has(key)
        ) {
          if (options.updateSnapshot) {
            if (!snapshot.matches(key, actual).pass) {
              snapshotState.updated++;
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
            const matcherName = 'toMatchSnapshot';
            const formatter = new JasmineFormatter(jasmine, {global: {}}, {});
            formatter.addDiffableMatcher(matcherName);
            message = formatter
              .formatMatchFailure(Object.assign({matcherName}, matches))
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
