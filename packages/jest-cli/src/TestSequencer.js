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

import type {AggregatedResult} from 'types/TestResult';
import type {Context} from 'types/Context';
import type {Tests} from 'types/TestRunner';

const fs = require('fs');
const getCacheFilePath = require('jest-haste-map').getCacheFilePath;

const FAIL = 0;
const SUCCESS = 1;

type Cache = {
  [key: string]: [0 | 1, number],
};

class TestSequencer {
  _context: Context;
  _cache: Cache;

  constructor(context: Context) {
    this._context = context;
    this._cache = {};
  }

  _getTestPerformanceCachePath() {
    const {config} = this._context;
    return getCacheFilePath(config.cacheDirectory, 'perf-cache-' + config.name);
  }

  // When running more tests than we have workers available, sort the tests
  // by size - big test files usually take longer to complete, so we run
  // them first in an effort to minimize worker idle time at the end of a
  // long test run.
  //
  // After a test run we store the time it took to run a test and on
  // subsequent runs we use that to run the slowest tests first, yielding the
  // fastest results.
  sort(tests: Tests): Tests {
    const stats = {};
    const fileSize = filePath =>
      stats[filePath] || (stats[filePath] = fs.statSync(filePath).size);
    const failed = filePath =>
      this._cache[filePath] && this._cache[filePath][0] === FAIL;
    const time = filePath => this._cache[filePath] && this._cache[filePath][1];

    this._cache = {};
    try {
      if (this._context.config.cache) {
        this._cache = JSON.parse(
          fs.readFileSync(this._getTestPerformanceCachePath(), 'utf8'),
        );
      }
    } catch (e) {}

    tests = tests.sort(({path: pathA}, {path: pathB}) => {
      const failedA = failed(pathA);
      const failedB = failed(pathB);
      if (failedA !== failedB) {
        return failedA ? -1 : 1;
      }
      const timeA = time(pathA);
      const timeB = time(pathB);
      const hasTimeA = timeA != null;
      const hasTimeB = timeB != null;
      // Check if only one of two tests has timing information
      if (hasTimeA != hasTimeB) {
        return hasTimeA ? 1 : -1;
      }
      if (timeA != null && !timeB != null) {
        return timeA < timeB ? 1 : -1;
      }
      return fileSize(pathA) < fileSize(pathB) ? 1 : -1;
    });

    tests.forEach(test => test.duration = time(test.path));
    return tests;
  }

  cacheResults(tests: Tests, results: AggregatedResult) {
    const cache = this._cache;
    const map = Object.create(null);
    tests.forEach(({path}) => map[path] = true);
    results.testResults.forEach(testResult => {
      if (testResult && map[testResult.testFilePath] && !testResult.skipped) {
        const perf = testResult.perfStats;
        cache[testResult.testFilePath] = [
          testResult.numFailingTests ? FAIL : SUCCESS,
          perf.end - perf.start || 0,
        ];
      }
    });
    fs.writeFileSync(
      this._getTestPerformanceCachePath(),
      JSON.stringify(cache),
    );
  }
}

module.exports = TestSequencer;
