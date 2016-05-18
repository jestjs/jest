/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const common = require('./common');
const fs = require('fs');
const path = require('path');
const serializer = require('./serializer');
const TestSnapshot = require('./TestSnapshot');

const SNAPSHOT_EXTENSION = '.snap';
const testsByPath =  Object.create(null);

const getNextIndexFor = (test, filePath) => {
  const tests = testsByPath[filePath] || (testsByPath[filePath] = {});
  if (tests[test] != null) {
    return ++tests[test];
  }
  return tests[test] = 0;
};

module.exports = (filePath, options, jasmine) => ({
  toMatchSnapshot: (util, customEquality) => {
    return {
      compare(actual, expected) {
        // Retrieving last test asap to avoid race condition
        const lastTest = common.getLastTest(filePath);

        const snapshotsPath = path.join(path.dirname(filePath), '__snapshots__');
        try {
          const folder = fs.statSync(snapshotsPath);
          if (!folder.isDirectory()) {
            fs.mkdirSync(snapshotsPath);
          }
        } catch (e) {
          fs.mkdirSync(snapshotsPath);
        }

        const snapshotFilename = path.join(
          snapshotsPath,
          path.basename(filePath) + SNAPSHOT_EXTENSION
        );

        if (expected !== undefined) {
          throw new Error('toMatchSnapshot() does not accepts parameters.');
        }
        const snapshot = new TestSnapshot(snapshotFilename);

        const lastTestIndex = getNextIndexFor(lastTest, filePath);
        let pass = false;
        let message;
        let res = {};
        const rendered = serializer.serialize(actual);
        const key = lastTest + ' ' + lastTestIndex;
        if (!snapshot.fileExists()) {
          snapshot.save({
            [key]: rendered,
          });
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
                  'toMatchSnapshot #' + lastTestIndex + ':'
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
