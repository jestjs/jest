/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Sequencer = require('@jest/test-sequencer').default;
const path = require('path');

const priorityOrder = [
  path.resolve('./d.test.js'),
  path.resolve('./b.test.js'),
  path.resolve('./c.test.js'),
];
const FAIL = 0;

class CustomSequencer extends Sequencer {
  sort(tests) {
    const stats = {};
    const fileSize = ({path, context: {hasteFS}}) =>
      stats[path] || (stats[path] = hasteFS.getSize(path) || 0);
    const hasFailed = (cache, test) =>
      cache[test.path] && cache[test.path][0] === FAIL;
    const time = (cache, test) => cache[test.path] && cache[test.path][1];

    tests.forEach(test => (test.duration = time(this._getCache(test), test)));
    return tests.sort((testA, testB) => {
      const cacheA = this._getCache(testA);
      const cacheB = this._getCache(testB);
      const failedA = hasFailed(cacheA, testA);
      const failedB = hasFailed(cacheB, testB);
      const hasTimeA = testA.duration != null;
      const indexA = priorityOrder.indexOf(testA.path);
      const indexB = priorityOrder.indexOf(testB.path);

      if (indexA !== indexB) {
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA < indexB ? -1 : 1;
      } else if (failedA !== failedB) {
        return failedA ? -1 : 1;
      } else if (hasTimeA != (testB.duration != null)) {
        // If only one of two tests has timing information, run it last
        return hasTimeA ? 1 : -1;
      } else if (testA.duration != null && testB.duration != null) {
        return testA.duration < testB.duration ? 1 : -1;
      } else {
        return fileSize(testA) < fileSize(testB) ? 1 : -1;
      }
    });
  }
}

module.exports = CustomSequencer;
