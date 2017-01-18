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
const throat = require('throat');
const workerFarm = require('worker-farm');
const TestWatcher = require('./TestWatcher');

const FAIL = 0;
const SLOW_TEST_TIME = 3000;
const SUCCESS = 1;

class CancelRun extends Error {
  constructor(message: ?string) {
    super(message);
    this.name = 'CancelRun';
  }
}

type Options = {|
  maxWorkers: number,
  getTestSummary: () => string,
|};

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
      if (this._config.cache) {
        this._testPerformanceCache = JSON.parse(fs.readFileSync(
          this._getTestPerformanceCachePath(),
          'utf8',
        ));
      } else {
        this._testPerformanceCache = {};
      }
    } catch (e) {
      this._testPerformanceCache = {};
    }

    const cache = this._testPerformanceCache;
    const timings = [];
    const stats = {};
    const getFileSize = filePath =>
      stats[filePath] || (stats[filePath] = fs.statSync(filePath).size);
    const getTestRunTime = filePath => {
      if (cache[filePath]) {
        return (cache[filePath][0] === FAIL) ? Infinity : cache[filePath][1];
      }
      return null;
    };

    testPaths = testPaths
      .sort((pathA, pathB) => {
        const timeA = getTestRunTime(pathA);
        const timeB = getTestRunTime(pathB);
        if (timeA != null && timeB != null) {
          return timeA < timeB ? 1 : -1;
        }
        return getFileSize(pathA) < getFileSize(pathB) ? 1 : -1;
      });

    testPaths.forEach(filePath => {
      const timing = cache[filePath] && cache[filePath][1];
      if (timing) {
        timings.push(timing);
      }
    });

    return {testPaths, timings};
  }

  _cacheTestResults(aggregatedResults: AggregatedResult) {
    const cache = this._testPerformanceCache;
    aggregatedResults.testResults.forEach(test => {
      if (test && !test.skipped) {
        const perf = test.perfStats;
        cache[test.testFilePath] = [
          test.numFailingTests ? FAIL : SUCCESS,
          (perf.end - perf.start) || 0,
        ];
      }
    });
    fs.writeFileSync(
      this._getTestPerformanceCachePath(),
      JSON.stringify(cache),
    );
  }

  runTests(paths: Array<string>, watcher: TestWatcher) {
    const config = this._config;
    const {testPaths, timings} = this._sortTests(paths);
    const aggregatedResults = createAggregatedResults(testPaths.length);
    const estimatedTime =
      Math.ceil(getEstimatedTime(timings, this._options.maxWorkers) / 1000);

    const onResult = (testPath: Path, testResult: TestResult) => {
      if (watcher.isInterrupted()) {
        return;
      }
      if (testResult.testResults.length === 0) {
        const message = 'Your test suite must contain at least one test.';
        onFailure(testPath, {
          message,
          stack: new Error(message).stack,
        });
        return;
      }
      addResult(aggregatedResults, testResult);
      this._dispatcher.onTestResult(
        config,
        testResult,
        aggregatedResults,
      );
      this._bailIfNeeded(aggregatedResults, watcher);
    };

    const onFailure = (testPath: Path, error: TestError) => {
      if (watcher.isInterrupted()) {
        return;
      }
      const testResult = buildFailureTestResult(testPath, error);
      testResult.failureMessage = formatExecError(testResult, config, testPath);
      addResult(aggregatedResults, testResult);
      this._dispatcher.onTestResult(
        config,
        testResult,
        aggregatedResults,
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
        timings.length > 0 && timings.every(timing => timing < SLOW_TEST_TIME)
      )
    );

    const updateSnapshotState = () => {
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

    const runInBand = shouldRunInBand();

    this._dispatcher.onRunStart(
      config,
      aggregatedResults,
      {
        estimatedTime,
        showStatus: !runInBand,
      },
    );

    const testRun =
      runInBand
        ? this._createInBandTestRun(testPaths, watcher, onResult, onFailure)
        : this._createParallelTestRun(testPaths, watcher, onResult, onFailure);

    return testRun
      .catch(error => {
        if (!watcher.isInterrupted()) {
          throw error;
        }
      })
      .then(() => {
        updateSnapshotState();
        aggregatedResults.wasInterrupted = watcher.isInterrupted();

        this._dispatcher.onRunComplete(config, aggregatedResults);

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

        this._cacheTestResults(aggregatedResults);
        return aggregatedResults;
      });
  }

  _createInBandTestRun(
    testPaths: Array<Path>,
    watcher: TestWatcher,
    onResult: OnTestResult,
    onFailure: OnRunFailure,
  ) {
    const mutex = throat(1);
    return testPaths.reduce(
      (promise, path) =>
        mutex(() =>
          promise
            .then(() => {
              if (watcher.isInterrupted()) {
                throw new CancelRun();
              }

              this._dispatcher.onTestStart(this._config, path);
              return runTest(
                path,
                this._config,
                this._hasteContext.resolver,
              );
            })
            .then(result => onResult(path, result))
            .catch(err => onFailure(path, err)),
        ),
      Promise.resolve(),
    );
  }

  _createParallelTestRun(
    testPaths: Array<Path>,
    watcher: TestWatcher,
    onResult: OnTestResult,
    onFailure: OnRunFailure,
  ) {
    const config = this._config;
    const farm = workerFarm({
      autoStart: true,
      maxConcurrentCallsPerWorker: 1,
      maxConcurrentWorkers: this._options.maxWorkers,
      maxRetries: 2, // Allow for a couple of transient errors.
    }, TEST_WORKER_PATH);
    const mutex = throat(this._options.maxWorkers);
    const worker = promisify(farm);

    // Send test suites to workers continuously instead of all at once to track
    // the start time of individual tests.
    const runTestInWorker = ({config, path}) => mutex(() => {
      if (watcher.isInterrupted()) {
        return Promise.reject();
      }
      this._dispatcher.onTestStart(config, path);
      return worker({
        config,
        path,
        rawModuleMap: watcher.isWatchMode()
          ? this._hasteContext.moduleMap.getRawModuleMap()
          : null,
      });
    });

    const onError = (err, path) => {
      onFailure(path, err);
      if (err.type === 'ProcessTerminatedError') {
        console.error(
          'A worker process has quit unexpectedly! ' +
          'Most likely this an initialization error.',
        );
        process.exit(1);
      }
    };

    const onInterrupt = new Promise((_, reject) => {
      watcher.on('change', state => {
        if (state.interrupted) {
          reject(new CancelRun());
        }
      });
    });

    const runAllTests = Promise.all(testPaths.map(path => {
      return runTestInWorker({config, path})
        .then(testResult => onResult(path, testResult))
        .catch(error => onError(error, path));
    }));

    const cleanup = () => workerFarm.end(farm);

    return Promise.race([
      runAllTests,
      onInterrupt,
    ]).then(cleanup, cleanup);
  }

  _setupReporters() {
    this.addReporter(
      this._config.verbose
        ? new VerboseReporter()
        : new DefaultReporter(),
    );

    if (this._config.collectCoverage) {
      // coverage reporter dependency graph is pretty big and we don't
      // want to require it if we're not in the `--coverage` mode
      const CoverageReporter = require('./reporters/CoverageReporter');
      this.addReporter(new CoverageReporter());
    }

    this.addReporter(new SummaryReporter());
    if (this._config.notify) {
      this.addReporter(new NotifyReporter());
    }
  }

  _bailIfNeeded(aggregatedResults: AggregatedResult, watcher: TestWatcher) {
    if (this._config.bail && aggregatedResults.numFailedTests !== 0) {
      if (watcher.isWatchMode()) {
        watcher.setState({interrupted: true});
      } else {
        this._dispatcher.onRunComplete(this._config, aggregatedResults);
        process.exit(1);
      }
    }
  }
}

const createAggregatedResults = (numTotalTestSuites: number) => {
  return {
    numFailedTestSuites: 0,
    numFailedTests: 0,
    numPassedTestSuites: 0,
    numPassedTests: 0,
    numPendingTestSuites: 0,
    numPendingTests: 0,
    numRuntimeErrorTestSuites: 0,
    numTotalTestSuites,
    numTotalTests: 0,
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
    wasInterrupted: false,
  };
};

const addResult = (
  aggregatedResults: AggregatedResult,
  testResult: TestResult,
): void => {
  aggregatedResults.testResults.push(testResult);
  aggregatedResults.numTotalTests +=
    testResult.numPassingTests +
    testResult.numFailingTests +
    testResult.numPendingTests;
  aggregatedResults.numFailedTests += testResult.numFailingTests;
  aggregatedResults.numPassedTests += testResult.numPassingTests;
  aggregatedResults.numPendingTests += testResult.numPendingTests;

  if (testResult.testExecError) {
    aggregatedResults.numRuntimeErrorTestSuites++;
  }

  if (testResult.skipped) {
    aggregatedResults.numPendingTestSuites++;
  } else if (testResult.numFailingTests > 0 || testResult.testExecError) {
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

  aggregatedResults.snapshot.added += testResult.snapshot.added;
  aggregatedResults.snapshot.matched += testResult.snapshot.matched;
  aggregatedResults.snapshot.unchecked += testResult.snapshot.unchecked;
  aggregatedResults.snapshot.unmatched += testResult.snapshot.unmatched;
  aggregatedResults.snapshot.updated += testResult.snapshot.updated;
  aggregatedResults.snapshot.total +=
    testResult.snapshot.added +
    testResult.snapshot.matched +
    testResult.snapshot.unmatched +
    testResult.snapshot.updated;
};

const buildFailureTestResult = (
  testPath: string,
  err: TestError,
): TestResult => {
  return {
    console: null,
    failureMessage: null,
    numFailingTests: 0,
    numPassingTests: 0,
    numPendingTests: 0,
    perfStats: {
      end: 0,
      start: 0,
    },
    skipped: false,
    snapshot: {
      added: 0,
      fileDeleted: false,
      matched: 0,
      unchecked: 0,
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
    this._runnerContext = {getTestSummary, hasteFS};
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
      reporter.onTestResult(
        config,
        testResult,
        results,
        this._runnerContext,
      ),
    );
  }

  onTestStart(config, path) {
    this._reporters.forEach(reporter =>
      reporter.onTestStart(config, path, this._runnerContext),
    );
  }

  onRunStart(config, results, options) {
    this._reporters.forEach(
      reporter => reporter.onRunStart(
        config,
        results,
        this._runnerContext,
        options,
      ),
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

const getEstimatedTime = (timings, workers) => {
  if (!timings.length) {
    return 0;
  }

  const max = Math.max.apply(null, timings);
  if (timings.length <= workers) {
    return max;
  }

  return Math.max(
    timings.reduce((sum, time) => sum + time) / workers,
    max,
  );
};

module.exports = TestRunner;
