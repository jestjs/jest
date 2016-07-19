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

import type {
  AggregatedResult,
  Error as TestError,
  TestResult,
} from 'types/TestResult';
import type {Config, Path} from 'types/Config';
import type {HasteContext} from 'types/HasteMap';
import type BaseReporter from './reporters/BaseReporter';

const Test = require('./Test');

const fs = require('graceful-fs');
const getCacheFilePath = require('jest-haste-map').getCacheFilePath;
const CoverageReporter = require('./reporters/CoverageReporter');
const DefaultReporter = require('./reporters/DefaultReporter');
const NotifyReporter = require('./reporters/NotifyReporter');
const SummaryReporter = require('./reporters/SummaryReporter');
const VerboseReporter = require('./reporters/VerboseReporter');
const promisify = require('./lib/promisify');
const snapshot = require('jest-snapshot');
const workerFarm = require('worker-farm');

type Options = {
  maxWorkers: number,
};

type OnRunFailure = (
  path: string,
  err: TestError,
) => void;

type OnTestResult = (
  path: string,
  result: TestResult,
) => void;

const TEST_WORKER_PATH = require.resolve('./TestWorker');

class TestRunner {
  _hasteContext: HasteContext;
  _config: Config;
  _options: Options;
  _dispatcher: ReporterDispatcher;
  _testPerformanceCache: Object | null;

  constructor(
    hasteMap: HasteContext,
    config: Config,
    options: Options,
  ) {
    this._config = config;
    this._dispatcher = new ReporterDispatcher();
    this._hasteContext = hasteMap;
    this._options = options;
    this._setupReporters();

    // Map from testFilePath -> time it takes to run the test. Used to
    // optimally schedule bigger test runs.
    this._testPerformanceCache = null;
  }

  addReporter(reporter: BaseReporter) {
    this._dispatcher.register(reporter);
  }

  removeReporter(ReporterClass: Function) {
    this._dispatcher.unregister(ReporterClass);
  }

  _getTestPerformanceCachePath() {
    const config = this._config;
    return getCacheFilePath(config.cacheDirectory, 'perf-cache-' + config.name);
  }

  _sortTests(testPaths: Array<string>) {
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
        this._getTestPerformanceCachePath(),
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

  _cacheTestResults(aggregatedResults: AggregatedResult) {
    const cacheFile = this._getTestPerformanceCachePath();
    const cache =
      this._testPerformanceCache || (this._testPerformanceCache = {});
    aggregatedResults.testResults.forEach(test => {
      const perf = test && test.perfStats;
      if (perf && perf.end && perf.start) {
        cache[test.testFilePath] = perf.end - perf.start;
      }
    });
    return promisify(fs.writeFile)(cacheFile, JSON.stringify(cache));
  }

  runTests(testPaths: Array<string>) {
    const config = this._config;
    testPaths = this._sortTests(testPaths);
    const aggregatedResults = createAggregatedResults(testPaths.length);
    this._dispatcher.onRunStart(config, aggregatedResults);

    const onTestResult = (testPath: Path, testResult: TestResult) => {
      if (testResult.testResults.length === 0) {
        const message = 'Your test suite must contain at least one test.';
        onRunFailure(testPath, {
          message,
          stack: new Error(message).stack,
        });
        return;
      }
      addResult(aggregatedResults, testResult);
      this._dispatcher.onTestResult(config, testResult, aggregatedResults);
      this._bailIfNeeded(aggregatedResults);
    };

    const onRunFailure = (testPath: Path, err: TestError) => {
      const testResult = buildFailureTestResult(testPath, err);
      aggregatedResults.testResults.push(testResult);
      aggregatedResults.numRuntimeErrorTestSuites++;
      this._dispatcher.onTestResult(config, testResult, aggregatedResults);
    };

    const testRun = this._createTestRun(testPaths, onTestResult, onRunFailure);

    return testRun
      .then(() => {
        aggregatedResults.success =
          aggregatedResults.numFailedTests === 0 &&
          aggregatedResults.numRuntimeErrorTestSuites === 0;
        return snapshot.cleanup(this._hasteContext, config.updateSnapshot)
          .then(status => {
            aggregatedResults.snapshotFilesRemoved = status.filesRemoved;
            aggregatedResults.didUpdate = config.updateSnapshot;
            this._dispatcher.onRunComplete(config, aggregatedResults);
            aggregatedResults.success = !this._dispatcher.hasErrors();
            return aggregatedResults;
          });
      })
      .then(results => this._cacheTestResults(results).then(() => results));
  }

  _createTestRun(
    testPaths: Array<Path>,
    onTestResult: OnTestResult,
    onRunFailure: (path: Path, err: TestError) => void,
  ) {
    if (this._options.maxWorkers <= 1 || testPaths.length <= 1) {
      return this._createInBandTestRun(testPaths, onTestResult, onRunFailure);
    } else {
      return this._createParallelTestRun(testPaths, onTestResult, onRunFailure);
    }
  }

  _createInBandTestRun(
    testPaths: Array<Path>,
    onTestResult: OnTestResult,
    onRunFailure: OnRunFailure,
  ) {
    return testPaths.reduce((promise, path) =>
      promise
        .then(() => this._hasteContext)
        .then(data => new Test(path, this._config, data.resolver).run())
        .then(result => onTestResult(path, result))
        .catch(err => onRunFailure(path, err)),
      Promise.resolve(),
    );
  }

  _createParallelTestRun(
    testPaths: Array<Path>,
    onTestResult: OnTestResult,
    onRunFailure: OnRunFailure,
  ) {
    const config = this._config;
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
              'Most likely this an initialization error.',
            );
            process.exit(1);
          }
        })),
    )
    .then(() => workerFarm.end(farm));
  }

  _setupReporters() {
    this.addReporter(new SummaryReporter());
    this.addReporter(
      this._config.verbose
        ? new VerboseReporter()
        : new DefaultReporter(),
    );

    if (this._config.notify) {
      this.addReporter(new NotifyReporter());
    }

    if (this._config.collectCoverage) {
      this.addReporter(new CoverageReporter());
    }
  }

  _bailIfNeeded(aggregatedResults: AggregatedResult) {
    if (this._config.bail) {
      this._dispatcher.onRunComplete(this._config, aggregatedResults);
      process.exit(1);
    }
  }
}

const createAggregatedResults = (numTotalTestSuites: number) => {
  return {
    didUpdate: false,
    numFailedTests: 0,
    numFailedTestSuites: 0,
    numPassedTests: 0,
    numPassedTestSuites: 0,
    numPendingTests: 0,
    numRuntimeErrorTestSuites: 0,
    numTotalTests: 0,
    numTotalTestSuites,
    snapshotFilesRemoved: 0,
    startTime: Date.now(),
    success: false,
    testResults: [],
  };
};

const addResult = (
  aggregatedResults: AggregatedResult,
  testResult: TestResult,
) => {
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
};

const buildFailureTestResult = (testPath: string, err: TestError) => {
  return {
    hasUncheckedKeys: false,
    numFailingTests: 1,
    numPassingTests: 0,
    numPendingTests: 0,
    perfStats: {
      end: 0,
      start: 0,
    },
    snapshotFileDeleted: false,
    snapshotsAdded: 0,
    snapshotsMatched: 0,
    snapshotsUnmatched: 0,
    snapshotsUpdated: 0,
    testExecError: err,
    testFilePath: testPath,
    testResults: [],
  };
};

// Proxy class that holds all reporter and dispatchers events to each
// of them.
class ReporterDispatcher {
  _reporters: Array<BaseReporter>;

  constructor() {
    this._reporters = [];
  }

  register(reporter: BaseReporter): void {
    this._reporters.push(reporter);
  }

  unregister(ReporterClass: Function) {
    this._reporters = this._reporters.filter(
      reporter => !(reporter instanceof ReporterClass),
    );
  }

  onTestResult() {
    this._reporters.forEach(
      reporter => reporter.onTestResult.apply(reporter, arguments),
    );
  }

  onRunStart() {
    this._reporters.forEach(
      reporter => reporter.onRunStart.apply(reporter, arguments),
    );
  }

  onRunComplete() {
    this._reporters.forEach(
      reporter => reporter.onRunComplete.apply(reporter, arguments),
    );
  }

  // Return a list of last errors for every reporter
  getErrors(): Array<Error> {
    return this._reporters.reduce(
      (list, reporter) => {
        const error = reporter.getLastError();
        return error ? list.concat(error) : list;
      },
      [],
    );
  }

  hasErrors(): boolean {
    return this.getErrors().length !== 0;
  }
}

module.exports = TestRunner;
