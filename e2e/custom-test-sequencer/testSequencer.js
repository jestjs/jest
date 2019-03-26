/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require('fs');
const path = require('path');
const {getCacheFilePath} = require('../../packages/jest-haste-map/build');

const priorityOrder = [
  path.resolve('./d.test.js'),
  path.resolve('./b.test.js'),
  path.resolve('./c.test.js'),
];
const FAIL = 0;
const SUCCESS = 1;

class TestSequencer {
  constructor() {
    this._cache = new Map();
  }
  _getCachePath(context) {
    const {config} = context;
    return getCacheFilePath(config.cacheDirectory, 'perf-cache-' + config.name);
  }

  _getCache(test) {
    const {context} = test;
    if (!this._cache.has(context) && context.config.cache) {
      const cachePath = this._getCachePath(context);
      if (fs.existsSync(cachePath)) {
        try {
          this._cache.set(
            context,
            JSON.parse(fs.readFileSync(cachePath, 'utf8'))
          );
        } catch (e) {}
      }
    }

    let cache = this._cache.get(context);
    if (!cache) {
      cache = {};
      this._cache.set(context, cache);
    }

    return cache;
  }

  /**
   * Sorting tests is very important because it has a great impact on the
   * user-perceived responsiveness and speed of the test run.
   *
   * If such information is on cache, tests are sorted based on:
   * -> Has it failed during the last run ?
   * Since it's important to provide the most expected feedback as quickly
   * as possible.
   * -> How long it took to run ?
   * Because running long tests first is an effort to minimize worker idle
   * time at the end of a long test run.
   * And if that information is not available they are sorted based on file size
   * since big test files usually take longer to complete.
   *
   * Note that a possible improvement would be to analyse other information
   * from the file other than its size.
   *
   */
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

  cacheResults(tests, results) {
    const map = Object.create(null);
    tests.forEach(test => (map[test.path] = test));
    results.testResults.forEach(testResult => {
      if (testResult && map[testResult.testFilePath] && !testResult.skipped) {
        const cache = this._getCache(map[testResult.testFilePath]);
        const perf = testResult.perfStats;
        cache[testResult.testFilePath] = [
          testResult.numFailingTests ? FAIL : SUCCESS,
          perf.end - perf.start || 0,
        ];
      }
    });

    this._cache.forEach((cache, context) =>
      fs.writeFileSync(this._getCachePath(context), JSON.stringify(cache))
    );
  }
}

module.exports = TestSequencer;
