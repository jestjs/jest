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
import type {HasteContext, HasteFS} from 'types/HasteMap';
import type {RunnerContext} from 'types/Reporters';
import type BaseReporter from './reporters/BaseReporter';

const {formatExecError} = require('jest-util');
const fs = require('graceful-fs');
const getCacheFilePath = require('jest-haste-map').getCacheFilePath;
const DefaultReporter = require('./reporters/DefaultReporter');
const NotifyReporter = require('./reporters/NotifyReporter');
const SummaryReporter = require('./reporters/SummaryReporter');
const VerboseReporter = require('./reporters/VerboseReporter');
const promisify = require('./lib/promisify');
const runTest = require('./runTest');
const snapshot = require('jest-snapshot');
const workerFarm = require('worker-farm');

const SLOW_TEST_TIME = 3000;

type Options = {
  maxWorkers: number,
  getTestSummary: () => string,
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
  _testPerformanceCache: Object;

  constructor(
    hasteContext: HasteContext,
    config: Config,
    options: Options,
  ) {
    this._config = config;
    this._dispatcher = new ReporterDispatcher(
      hasteContext.hasteFS,
      options.getTestSummary,
    );
    this._hasteContext = hasteContext;
    this._options = options;
    this._setupReporters();

    // Map from testFilePath -> time it takes to run the test. Used to
    // optimally schedule bigger test runs.
    this._testPerformanceCache = {};
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
        'utf8',
      ));
    } catch (e) {
      this._testPerformanceCache = {};
    }

    const testPerformanceCache = this._testPerformanceCache;
    const timings = [];
    testPaths = testPaths
      .map(path => ({path, size: fs.statSync(path).size}))
      .sort((a, b) => {
        const cacheA = testPerformanceCache && testPerformanceCache[a.path];
        const cacheB = testPerformanceCache && testPerformanceCache[b.path];
        if (cacheA !== null && cacheB !== null) {
          return cacheA < cacheB ? 1 : -1;
        }
        return a.size < b.size ? 1 : -1;
      })
      .map(item => {
        if (testPerformanceCache[item.path]) {
          timings.push(testPerformanceCache[item.path]);
        }
        return item.path;
      });

    return {testPaths, timings};
  }

  _cacheTestResults(aggregatedResults: AggregatedResult) {
    const cacheFile = this._getTestPerformanceCachePath();
    const cache = this._testPerformanceCache;
    aggregatedResults.testResults.forEach(test => {
      const perf = test && test.perfStats;
      if (perf && perf.end && perf.start) {
        cache[test.testFilePath] = perf.end - perf.start;
      }
    });
    return promisify(fs.writeFile)(cacheFile, JSON.stringify(cache));
  }

  runTests(paths: Array<string>) {
    const config = this._config;
    const {testPaths, timings} = this._sortTests(paths);
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
      testResult.failureMessage = formatExecError(testResult, config, testPath);
      aggregatedResults.testResults.push(testResult);
      aggregatedResults.numRuntimeErrorTestSuites++;
      this._dispatcher.onTestResult(config, testResult, aggregatedResults);
    };

    const setSuccess = () => {
      const anyTestFailures = !(
        aggregatedResults.numFailedTests === 0 &&
        aggregatedResults.numRuntimeErrorTestSuites === 0
      );

      const anyReporterErrors = this._dispatcher.hasErrors();

      aggregatedResults.success = !(
        anyTestFailures ||
        aggregatedResults.snapshot.failure ||
        anyReporterErrors
      );
    };

    const updateSnapshotSummary = () => {
      const status =
        snapshot.cleanup(this._hasteContext.hasteFS, config.updateSnapshot);
      aggregatedResults.snapshot.filesRemoved += status.filesRemoved;
      aggregatedResults.snapshot.didUpdate = config.updateSnapshot;
      aggregatedResults.snapshot.failure = !!(
        !aggregatedResults.snapshot.didUpdate && (
          aggregatedResults.snapshot.unchecked ||
          aggregatedResults.snapshot.unmatched ||
          aggregatedResults.snapshot.filesRemoved
        )
      );
    };

    // Run in band if we only have one test or one worker available.
    // If we are confident from previous runs that the tests will finish quickly
    // we also run in band to reduce the overhead of spawning workers.
    const shouldRunInBand = () => (
      this._options.maxWorkers <= 1 ||
      testPaths.length <= 1 ||
      (
        testPaths.length <= 20 &&
        timings.every(timing => timing < SLOW_TEST_TIME)
      )
    );

    const testRun =
      shouldRunInBand()
      ? this._createInBandTestRun(testPaths, onTestResult, onRunFailure)
      : this._createParallelTestRun(testPaths, onTestResult, onRunFailure);

    return testRun
      .then(updateSnapshotSummary)
      .then(() => this._dispatcher.onRunComplete(config, aggregatedResults))
      .then(setSuccess)
      .then(() => this._cacheTestResults(aggregatedResults))
      .then(() => aggregatedResults);
  }

  _createInBandTestRun(
    testPaths: Array<Path>,
    onTestResult: OnTestResult,
    onRunFailure: OnRunFailure,
  ) {
    return testPaths.reduce((promise, path) =>
      promise
        .then(() => this._hasteContext)
        .then(data => runTest(path, this._config, data.resolver))
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
    const runTestInWorkerFarm = promisify(farm);
    return Promise.all(testPaths.map(
      path => runTestInWorkerFarm({path, config})
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
    if (this._config.collectCoverage) {
      // coverage reporter dependency graph is pretty big and we don't
      // want to require it if we're not in the `--coverage` mode
      const CoverageReporter = require('./reporters/CoverageReporter');
      this.addReporter(new CoverageReporter());
    }
    this.addReporter(new SummaryReporter());
    this.addReporter(
      this._config.verbose
        ? new VerboseReporter()
        : new DefaultReporter(),
    );

    if (this._config.notify) {
      this.addReporter(new NotifyReporter());
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
    numFailedTests: 0,
    numFailedTestSuites: 0,
    numPassedTests: 0,
    numPassedTestSuites: 0,
    numPendingTests: 0,
    numRuntimeErrorTestSuites: 0,
    numTotalTests: 0,
    numTotalTestSuites,
    snapshot: {
      added: 0,
      didUpdate: false, // is set only after the full run
      failure: false,
      filesAdded: 0,
      // combines individual test results + results after full run
      filesRemoved: 0,
      filesUnmatched: 0,
      filesUpdated: 0,
      matched: 0,
      total: 0,
      unchecked: 0,
      unmatched: 0,
      updated: 0,
    },
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

  // Snapshot data


  if (testResult.snapshot.added) {
    aggregatedResults.snapshot.filesAdded++;
  }
  if (testResult.snapshot.fileDeleted) {
    aggregatedResults.snapshot.filesRemoved++;
  }
  if (testResult.snapshot.unmatched) {
    aggregatedResults.snapshot.filesUnmatched++;
  }
  if (testResult.snapshot.updated) {
    aggregatedResults.snapshot.filesUpdated++;
  }
  if (testResult.hasUncheckedKeys) {
    aggregatedResults.snapshot.unchecked++;
  }

  aggregatedResults.snapshot.added += testResult.snapshot.added;
  aggregatedResults.snapshot.matched += testResult.snapshot.matched;
  aggregatedResults.snapshot.unmatched += testResult.snapshot.unmatched;
  aggregatedResults.snapshot.updated += testResult.snapshot.updated;
  aggregatedResults.snapshot.total +=
    testResult.snapshot.added +
    testResult.snapshot.matched +
    testResult.snapshot.updated;
};

const buildFailureTestResult = (
  testPath: string,
  err: TestError,
): TestResult => {
  return {
    failureMessage: null,
    hasUncheckedKeys: false,
    numFailingTests: 1,
    numPassingTests: 0,
    numPendingTests: 0,
    perfStats: {
      end: 0,
      start: 0,
    },
    snapshot: {
      fileDeleted: false,
      added: 0,
      matched: 0,
      unmatched: 0,
      updated: 0,
    },
    testExecError: err,
    testFilePath: testPath,
    testResults: [],
  };
};

// Proxy class that holds all reporter and dispatchers events to each
// of them.
class ReporterDispatcher {
  _disabled: boolean;
  _reporters: Array<BaseReporter>;
  _runnerContext: RunnerContext;

  constructor(hasteFS: HasteFS, getTestSummary: () => string) {
    this._runnerContext = {hasteFS, getTestSummary};
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

  onTestResult(config, testResult, results) {
    this._reporters.forEach(reporter =>
      reporter.onTestResult(config, testResult, results, this._runnerContext),
    );
  }

  onRunStart(config, results) {
    this._reporters.forEach(
      reporter => reporter.onRunStart(config, results, this._runnerContext),
    );
  }

  onRunComplete(config, results) {
    this._reporters.forEach(reporter =>
      reporter.onRunComplete(config, results, this._runnerContext),
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
