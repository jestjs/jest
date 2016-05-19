/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const serializer = require('./serializer');

module.exports = (filePath, options, jasmine, snapshotState) => ({
  toMatchSnapshot: (util, customEquality) => {
    return {
      compare(rendered, expected) {

        const specRunningFullName = snapshotState.specRunningFullName;

        if (expected !== undefined) {
          throw new Error('toMatchSnapshot() does not accepts parameters.');
        }
        if (typeof rendered !== 'string') {
          throw new Error('toMatchSnapshot() only works with Strings.');
        }

        const snapshot = snapshotState.snapshot;

        const specRunningCallCounter = (
            snapshotState.specsNextCallCounter[specRunningFullName]
        );

        let pass = false;
        let message;
        let res = {};
        const key = specRunningFullName + ' ' + specRunningCallCounter;

        if (!snapshot.fileExists()) {
          snapshot.replace(key, rendered);
          pass = true;
        } else {
          if (!snapshot.has(key)) {
            snapshot.add(key, rendered);
            pass = true;
          } else {
            if (options.updateSnapshot) {
              snapshot.replace(key, rendered);
              pass = true;
            } else {
              pass = snapshot.matches(key, rendered);
              if (!pass) {
                const matcherName = 'toMatchSnapshot';
                res = {
                  matcherName,
                  expected: snapshot.get(key),
                  actual: rendered,
                };

                const JasmineFormatter = require('jest-util').JasmineFormatter;

                const formatter = new JasmineFormatter(jasmine, {global: {}}, {});
                formatter.addDiffableMatcher('toMatchSnapshot');
                message = formatter.formatMatchFailure(res).replace(
                  'toMatchSnapshot:',
                  'toMatchSnapshot #' + specRunningCallCounter + ':'
                );
              }
            }
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
