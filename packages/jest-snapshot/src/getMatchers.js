/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

module.exports = (filePath, options, jasmine, snapshotState) => ({
  toMatchSnapshot: (util, customEquality) => {
    return {
      negativeCompare() {
        throw new Error(
          'Jest: `.not` can not be used with `.toMatchSnapshot()`.'
        );
      },
      compare(rendered, expected) {

        const currentSpecName = snapshotState.currentSpecName;

        if (expected !== undefined) {
          throw new Error('toMatchSnapshot() does not accepts parameters.');
        }
        if (typeof rendered !== 'string') {
          throw new Error('toMatchSnapshot() only works with Strings.');
        }

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
          if (options.updateSnapshot && snapshot.has(key)) {
            snapshotState.removed++;
          }
          snapshot.add(key, rendered);
          snapshotState.added++;
          pass = true;
        } else {
          pass = snapshot.matches(key, rendered);
          if (!pass) {
            const matcherName = 'toMatchSnapshot';
            const res = {
              matcherName,
              expected: snapshot.get(key),
              actual: rendered,
            };

            const JasmineFormatter = require('jest-util').JasmineFormatter;

            const formatter = new JasmineFormatter(jasmine, {global: {}}, {});
            formatter.addDiffableMatcher('toMatchSnapshot');
            message = formatter.formatMatchFailure(res).replace(
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
