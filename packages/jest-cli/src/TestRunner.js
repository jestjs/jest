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
import type {Config, ReporterConfig} from 'types/Config';
import type {Context} from 'types/Context';
import type {Test, Tests} from 'types/TestRunner';

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
const ReporterDispatcher = require('./ReporterDispatcher');
const chalk = require('chalk');

const DEFAULT_REPORTER_LABEL = 'default';
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
  _context: Context;
  _config: Config;
  _options: Options;
  _startRun: () => *;
  _dispatcher: ReporterDispatcher;

  constructor(
    hasteContext: Context,
    config: Config,
    options: Options,
    startRun: () => *,
  ) {
    this._config = config;
    this._dispatcher = new ReporterDispatcher(
      hasteContext.hasteFS,
      options.getTestSummary,
    );
    this._context = hasteContext;
    this._options = options;
    this._startRun = startRun;
    this._setupReporters();
  }

  addReporter(reporter: Object) {
    this._dispatcher.register(reporter);
  }

  removeReporter(ReporterClass: Function) {
    this._dispatcher.unregister(ReporterClass);
  }

  async runTests(tests: Tests, watcher: TestWatcher) {
    const timings = [];
    tests.forEach(test => {
      if (test.duration) {
        timings.push(test.duration);
      }
    });

    const config = this._config;
    const aggregatedResults = createAggregatedResults(tests.length);
    const estimatedTime = Math.ceil(
      getEstimatedTime(timings, this._options.maxWorkers) / 1000,
    );

    // Run in band if we only have one test or one worker available.
    // If we are confident from previous runs that the tests will finish quickly
    // we also run in band to reduce the overhead of spawning workers.
    const runInBand = this._options.maxWorkers <= 1 ||
      tests.length <= 1 ||
      (tests.length <= 20 &&
        timings.length > 0 &&
        timings.every(timing => timing < SLOW_TEST_TIME));

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

    const updateSnapshotState = () => {
      const status = snapshot.cleanup(
        this._context.hasteFS,
        config.updateSnapshot,
      );
      aggregatedResults.snapshot.filesRemoved += status.filesRemoved;
      aggregatedResults.snapshot.didUpdate = config.updateSnapshot;
      aggregatedResults.snapshot.failure = !!(!config.updateSnapshot &&
        (aggregatedResults.snapshot.unchecked ||
          aggregatedResults.snapshot.unmatched ||
          aggregatedResults.snapshot.filesRemoved));
    };

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
      (promise, test) =>
        mutex(() =>
          promise
            .then(() => {
              if (watcher.isInterrupted()) {
                throw new CancelRun();
              }

              this._dispatcher.onTestStart(test.config, test.path);
              return runTest(test.path, test.config, this._context.resolver);
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
    const runTestInWorker = ({config, path}) =>
      mutex(() => {
        if (watcher.isInterrupted()) {
          return Promise.reject();
        }
        this._dispatcher.onTestStart(config, path);
        return worker({
          config,
          path,
          rawModuleMap: watcher.isWatchMode()
            ? this._context.moduleMap.getRawModuleMap()
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

  /** 
   * Checks if default reporters should be added or not
   * @private
   */
  _shouldAddDefaultReporters(reporters?: Array<ReporterConfig>): boolean {
    return !reporters || reporters.indexOf(DEFAULT_REPORTER_LABEL) !== -1;
  }

  /**
   * Main method to Setup reporters to be used with TestRunner
   * @private
   */
  _setupReporters() {
    const config = this._config;
    const reporters = config.reporters;
    const isDefault: boolean = this._shouldAddDefaultReporters(reporters);

    if (isDefault) {
      this._setupDefaultReporters(config);
    }

    if (reporters && Array.isArray(reporters)) {
      this._addCustomReporters(reporters);
    }

    if (config.collectCoverage) {
      // coverage reporter dependency graph is pretty big and we don't
      // want to require it if we're not in the `--coverage` mode
      const CoverageReporter = require('./reporters/CoverageReporter');
      this.addReporter(new CoverageReporter());
    }

    if (config.notify) {
      this.addReporter(new NotifyReporter(this._startRun));
    }
  }

  _setupDefaultReporters(config: Config) {
    this.addReporter(
      config.verbose ? new VerboseReporter(config) : new DefaultReporter(),
    );

    this.addReporter(new SummaryReporter());
  }

  /**
   * Adds Custom reporters to Jest
   * @private
   */
  _addCustomReporters(reporters: Array<ReporterConfig>) {
    const customReporter = reporters.filter(reporter => reporter !== 'default');

    customReporter.forEach((reporter, index) => {
      const {options, path} = this._getReporterProps(reporter);

      try {
        const Reporter = require(path);
        this.addReporter(new Reporter(options));
      } catch (error) {
        console.error(
          chalk.red(
            'An error occured while adding the reporter at path ' + path,
          ),
        );
        throw error;
      }
    });
  }

  /**
   * Get properties of a reporter in an object
   * to make dealing with them less painful
   *
   * Objects contain the following properties:
   *  - options
   *  - path 
   */
  _getReporterProps(reporter: ReporterConfig): Object {
    let props = {};
    if (typeof reporter === 'string') {
      props = {path: reporter};
    } else if (Array.isArray(reporter)) {
      const [path, options] = reporter;
      props = {options, path};
    }

    return props;
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

const getEstimatedTime = (timings, workers) => {
  if (!timings.length) {
    return 0;
  }

  const max = Math.max.apply(null, timings);
  return timings.length <= workers
    ? max
    : Math.max(timings.reduce((sum, time) => sum + time) / workers, max);
};

module.exports = TestRunner;
