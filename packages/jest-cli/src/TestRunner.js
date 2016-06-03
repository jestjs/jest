/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const Test = require('./Test');

const fs = require('graceful-fs');
const getCacheFilePath = require('jest-haste-map').getCacheFilePath;
const promisify = require('./lib/promisify');
const workerFarm = require('worker-farm');

const TEST_WORKER_PATH = require.resolve('./TestWorker');

class TestRunner {

  constructor(hasteMap, config, options) {
    this._hasteMap = hasteMap;
    this._config = config;
    this._options = options;

    // Map from testFilePath -> time it takes to run the test. Used to
    // optimally schedule bigger test runs.
    this._testPerformanceCache = null;
  }

  _getTestPerformanceCachePath() {
    const config = this._config;
    return getCacheFilePath(config.cacheDirectory, 'perf-cache-' + config.name);
  }

  _sortTests(testPaths) {
    // When running more tests than we have workers available, sort the tests
    // by size - big test files usually take longer to complete, so we run
    // them first in an effort to minimize worker idle time at the end of a
    // long test run.
    //
    // After a test run we store the time it took to run a test and on
    // subsequent runs we use that to run the slowest tests first, yielding the
    // fastest results.
    try {
      this._testPerformanceCache = JSON.parse(fs.readFileSync(
        this._getTestPerformanceCachePath()
      ));
    } catch (e) {}

    const testPerformanceCache = this._testPerformanceCache;
    if (testPaths.length > this._options.maxWorkers) {
      testPaths = testPaths
        .map(path => [path, fs.statSync(path).size])
        .sort((a, b) => {
          const cacheA = testPerformanceCache && testPerformanceCache[a[0]];
          const cacheB = testPerformanceCache && testPerformanceCache[b[0]];
          if (cacheA !== null && cacheB !== null) {
            return cacheA < cacheB ? 1 : -1;
          }
          return a[1] < b[1] ? 1 : -1;
        })
        .map(p => p[0]);
    }

    return testPaths;
  }

  _cacheTestResults(aggregatedResults) {
    const cacheFile = this._getTestPerformanceCachePath();
    let cache = this._testPerformanceCache;
    if (!cache) {
      cache = this._testPerformanceCache = {};
    }
    aggregatedResults.testResults.forEach(test => {
      const perf = test && test.perfStats;
      if (perf && perf.end && perf.start) {
        cache[test.testFilePath] = perf.end - perf.start;
      }
    });
    return promisify(fs.writeFile)(cacheFile, JSON.stringify(cache));
  }

  runTests(testPaths, reporter) {
    const config = this._config;
    if (!reporter) {
      const TestReporter = require(config.testReporter);
      if (config.useStderr) {
        reporter = new TestReporter(Object.create(
          process,
          {stdout: {value: process.stderr}}
        ));
      } else {
        reporter = new TestReporter();
      }
    }

    testPaths = this._sortTests(testPaths);

    const aggregatedResults = {
      success: null,
      startTime: null,
      numTotalTestSuites: testPaths.length,
      numPassedTestSuites: 0,
      numFailedTestSuites: 0,
      numRuntimeErrorTestSuites: 0,
      numTotalTests: 0,
      numPassedTests: 0,
      numFailedTests: 0,
      numPendingTests: 0,
      testResults: [],
    };

    reporter.onRunStart && reporter.onRunStart(config, aggregatedResults);

    const onTestResult = (testPath, testResult) => {
      aggregatedResults.testResults.push(testResult);
      aggregatedResults.numTotalTests +=
        testResult.numPassingTests +
        testResult.numFailingTests +
        testResult.numPendingTests;

      aggregatedResults.numFailedTests += testResult.numFailingTests;
      aggregatedResults.numPassedTests += testResult.numPassingTests;
      aggregatedResults.numPendingTests += testResult.numPendingTests;
      if (testResult.numFailingTests > 0) {
        aggregatedResults.numFailedTestSuites++;
      } else {
        aggregatedResults.numPassedTestSuites++;
      }
      reporter.onTestResult && reporter.onTestResult(
        config,
        testResult,
        aggregatedResults
      );
    };

    const onRunFailure = (testPath, err) => {
      const testResult = {
        testFilePath: testPath,
        testExecError: err,
        testResults: [],
      };
      aggregatedResults.testResults.push(testResult);
      aggregatedResults.numRuntimeErrorTestSuites++;
      if (reporter.onTestResult) {
        reporter.onTestResult(config, testResult, aggregatedResults);
      }
    };

    aggregatedResults.startTime = Date.now();
    const testRun = this._createTestRun(testPaths, onTestResult, onRunFailure);

    return testRun
      .then(() => {
        aggregatedResults.success =
          aggregatedResults.numFailedTests === 0 &&
          aggregatedResults.numRuntimeErrorTestSuites === 0;
        if (reporter.onRunComplete) {
          reporter.onRunComplete(config, aggregatedResults);
        }
        return aggregatedResults;
      })
      .then(results => this._cacheTestResults(results).then(() => results));
  }

  _createTestRun(testPaths, onTestResult, onRunFailure) {
    if (this._options.maxWorkers <= 1 || testPaths.length <= 1) {
      return this._createInBandTestRun(testPaths, onTestResult, onRunFailure);
    } else {
      return this._createParallelTestRun(testPaths, onTestResult, onRunFailure);
    }
  }

  _createInBandTestRun(testPaths, onTestResult, onRunFailure) {
    return testPaths.reduce((promise, path) =>
      promise
        .then(() => this._hasteMap)
        .then(data => new Test(path, this._config, data.resolver).run())
        .then(result => onTestResult(path, result))
        .catch(err => onRunFailure(path, err)),
      Promise.resolve()
    );
  }

  _createParallelTestRun(testPaths, onTestResult, onRunFailure) {
    const config = this._config;
    return this._hasteMap
      .then(() => {
        const farm = workerFarm({
          autoStart: true,
          maxConcurrentCallsPerWorker: 1,
          maxRetries: 2, // Allow for a couple of transient errors.
          maxConcurrentWorkers: this._options.maxWorkers,
        }, TEST_WORKER_PATH);
        const runTest = promisify(farm);
        return Promise.all(testPaths.map(
          path => runTest({path, config})
            .then(testResult => onTestResult(path, testResult))
            .catch(err => {
              onRunFailure(path, err);
              if (err.type === 'ProcessTerminatedError') {
                console.error(
                  'A worker process has quit unexpectedly! ' +
                  'Most likely this an initialization error.'
                );
                process.exit(1);
              }
            }))
        )
        .then(() => workerFarm.end(farm));
      });
  }

}

module.exports = TestRunner;
