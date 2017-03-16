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
  SerializableError as TestError,
  TestResult,
} from 'types/TestResult';
import type {Config} from 'types/Config';
import type {HasteContext, HasteFS} from 'types/HasteMap';
import type {RunnerContext} from 'types/Reporters';
import type {Test, Tests} from 'types/TestRunner';
import type BaseReporter from './reporters/BaseReporter';

const {formatExecError} = require('jest-message-util');

const DefaultReporter = require('./reporters/DefaultReporter');
const NotifyReporter = require('./reporters/NotifyReporter');
const SummaryReporter = require('./reporters/SummaryReporter');
const VerboseReporter = require('./reporters/VerboseReporter');
const pify = require('pify');
const runTest = require('./runTest');
const snapshot = require('jest-snapshot');
const throat = require('throat');
const workerFarm = require('worker-farm');
const TestWatcher = require('./TestWatcher');

const SLOW_TEST_TIME = 3000;

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

type OnTestFailure = (test: Test, err: TestError) => void;
type OnTestSuccess = (test: Test, result: TestResult) => void;

const TEST_WORKER_PATH = require.resolve('./TestWorker');

class TestRunner {
  _hasteContext: HasteContext;
  _config: Config;
  _options: Options;
  _startRun: () => *;
  _dispatcher: ReporterDispatcher;

  constructor(
    hasteContext: HasteContext,
    config: Config,
    options: Options,
    startRun: () => *,
  ) {
    this._config = config;
    this._dispatcher = new ReporterDispatcher(
      hasteContext.hasteFS,
      options.getTestSummary,
    );
    this._hasteContext = hasteContext;
    this._options = options;
    this._startRun = startRun;
    this._setupReporters();
  }

  addReporter(reporter: BaseReporter) {
    this._dispatcher.register(reporter);
  }

  removeReporter(ReporterClass: Function) {
    this._dispatcher.unregister(ReporterClass);
  }

  async runTests(tests: Tests, watcher: TestWatcher) {
    const config = this._config;
    const timings = [];
    tests.forEach(test => {
      if (test.duration) {
        timings.push(test.duration);
      }
    });
    const aggregatedResults = createAggregatedResults(tests.length);
    const estimatedTime = Math.ceil(
      getEstimatedTime(timings, this._options.maxWorkers) / 1000,
    );

    const onResult = (test: Test, testResult: TestResult) => {
      if (watcher.isInterrupted()) {
        return;
      }
      if (testResult.testResults.length === 0) {
        const message = 'Your test suite must contain at least one test.';
        onFailure(test, {
          message,
          stack: new Error(message).stack,
        });
        return;
      }
      addResult(aggregatedResults, testResult);
      this._dispatcher.onTestResult(config, testResult, aggregatedResults);
      this._bailIfNeeded(aggregatedResults, watcher);
    };

    const onFailure = (test: Test, error: TestError) => {
      if (watcher.isInterrupted()) {
        return;
      }
      const testResult = buildFailureTestResult(test.path, error);
      testResult.failureMessage = formatExecError(
        testResult,
        test.config,
        test.path,
      );
      addResult(aggregatedResults, testResult);
      this._dispatcher.onTestResult(config, testResult, aggregatedResults);
    };

    // Run in band if we only have one test or one worker available.
    // If we are confident from previous runs that the tests will finish quickly
    // we also run in band to reduce the overhead of spawning workers.
    const shouldRunInBand = () =>
      this._options.maxWorkers <= 1 ||
      tests.length <= 1 ||
      (tests.length <= 20 &&
        timings.length > 0 &&
        timings.every(timing => timing < SLOW_TEST_TIME));

    const updateSnapshotState = () => {
      const status = snapshot.cleanup(
        this._hasteContext.hasteFS,
        config.updateSnapshot,
      );
      aggregatedResults.snapshot.filesRemoved += status.filesRemoved;
      aggregatedResults.snapshot.didUpdate = config.updateSnapshot;
      aggregatedResults.snapshot.failure = !!(!config.updateSnapshot &&
        (aggregatedResults.snapshot.unchecked ||
          aggregatedResults.snapshot.unmatched ||
          aggregatedResults.snapshot.filesRemoved));
    };

    const runInBand = shouldRunInBand();

    this._dispatcher.onRunStart(config, aggregatedResults, {
      estimatedTime,
      showStatus: !runInBand,
    });

    try {
      await (runInBand
        ? this._createInBandTestRun(tests, watcher, onResult, onFailure)
        : this._createParallelTestRun(tests, watcher, onResult, onFailure));
    } catch (error) {
      if (!watcher.isInterrupted()) {
        throw error;
      }
    }

    updateSnapshotState();
    aggregatedResults.wasInterrupted = watcher.isInterrupted();

    this._dispatcher.onRunComplete(config, aggregatedResults);

    const anyTestFailures = !(aggregatedResults.numFailedTests === 0 &&
      aggregatedResults.numRuntimeErrorTestSuites === 0);
    const anyReporterErrors = this._dispatcher.hasErrors();

    aggregatedResults.success = !(anyTestFailures ||
      aggregatedResults.snapshot.failure ||
      anyReporterErrors);

    return aggregatedResults;
  }

  _createInBandTestRun(
    tests: Tests,
    watcher: TestWatcher,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure,
  ) {
    const mutex = throat(1);
    return tests.reduce(
      (promise, test) => mutex(() => promise
        .then(() => {
          if (watcher.isInterrupted()) {
            throw new CancelRun();
          }

          this._dispatcher.onTestStart(test.config, test.path);
          return runTest(test.path, test.config, this._hasteContext.resolver);
        })
        .then(result => onResult(test, result))
        .catch(err => onFailure(test, err))),
      Promise.resolve(),
    );
  }

  _createParallelTestRun(
    tests: Tests,
    watcher: TestWatcher,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure,
  ) {
    const farm = workerFarm(
      {
        autoStart: true,
        maxConcurrentCallsPerWorker: 1,
        maxConcurrentWorkers: this._options.maxWorkers,
        maxRetries: 2, // Allow for a couple of transient errors.
      },
      TEST_WORKER_PATH,
    );
    const mutex = throat(this._options.maxWorkers);
    const worker = pify(farm);

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

    const onError = (err, test) => {
      onFailure(test, err);
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

    const runAllTests = Promise.all(
      tests.map(test =>
        runTestInWorker(test)
          .then(testResult => onResult(test, testResult))
          .catch(error => onError(error, test))),
    );

    const cleanup = () => workerFarm.end(farm);
    return Promise.race([runAllTests, onInterrupt]).then(cleanup, cleanup);
  }

  _setupReporters() {
    const config = this._config;

    this.addReporter(
      config.verbose ? new VerboseReporter(config) : new DefaultReporter(),
    );

    if (config.collectCoverage) {
      // coverage reporter dependency graph is pretty big and we don't
      // want to require it if we're not in the `--coverage` mode
      const CoverageReporter = require('./reporters/CoverageReporter');
      this.addReporter(new CoverageReporter());
    }

    this.addReporter(new SummaryReporter());
    if (config.notify) {
      this.addReporter(new NotifyReporter(this._startRun));
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
  aggregatedResults.numTotalTests += testResult.numPassingTests +
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
  aggregatedResults.snapshot.total += testResult.snapshot.added +
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
    sourceMaps: {},
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
      reporter.onTestResult(config, testResult, results, this._runnerContext));
  }

  onTestStart(config, path) {
    this._reporters.forEach(reporter =>
      reporter.onTestStart(config, path, this._runnerContext));
  }

  onRunStart(config, results, options) {
    this._reporters.forEach(reporter =>
      reporter.onRunStart(config, results, this._runnerContext, options));
  }

  onRunComplete(config, results) {
    this._reporters.forEach(reporter =>
      reporter.onRunComplete(config, results, this._runnerContext));
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

  return Math.max(timings.reduce((sum, time) => sum + time) / workers, max);
};

module.exports = TestRunner;
