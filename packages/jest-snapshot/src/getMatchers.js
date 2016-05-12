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
const Snapshot = require('./Snapshot');

const testsByPath =  {};
const getNextIndexFor = (test, filePath) => {
  const tests = testsByPath[filePath] || (testsByPath[filePath] = {});
  if (test in tests) {
    return ++tests[test];
  }
  return tests[test] = 0;
};

module.exports = (filePath, options) => ({
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
        // the extension has to be not a jest test one.
        const snapshotsName = path.join(
          snapshotsPath,
          path.basename(filePath) + '.snap'
        );


        if (expected !== undefined) {
          throw Error('toMatchSnapshot() doesn\' t take parameters (yet)');
        }
        const snapshot = new Snapshot(snapshotsName);

        const lastTestIndex = getNextIndexFor(lastTest, filePath);
        let pass = false;
        let message;
        let res = {};
        const rendered = serializer.serialize(actual);
        const key = lastTest + ' #' + lastTestIndex;
        if (!snapshot.exists()) {
          snapshot.save({
            [key]: rendered,
          });
          pass = true;
        } else {
          if (!snapshot.has(key)) {
            snapshot.add(key, rendered);
            pass = true;
          } else {
            if (options.overwriteSnapshot) {
              snapshot.replace(key, rendered);
              pass = true;
            } else {
              pass = snapshot.is(key, rendered);
              if (!pass) {
                const matcherName = 'toMatchSnapshot';
                res = {
                  matcherName,
                  expected: snapshot.get(key),
                  actual: rendered,
                };

                const formatter = common.getFormatter();
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
