/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {
  AggregatedResult,
  SerializableError as TestError,
  TestResult,
} from 'types/TestResult';
import type {GlobalConfig, ReporterConfig} from 'types/Config';
import type {Context} from 'types/Context';
import type {Reporter, Test} from 'types/TestRunner';

import {formatExecError} from 'jest-message-util';
import {
  addResult,
  buildFailureTestResult,
  makeEmptyAggregatedTestResult,
} from './test_result_helpers';
import snapshot from 'jest-snapshot';
import pify from 'pify';
import throat from 'throat';
import workerFarm from 'worker-farm';
import DefaultReporter from './reporters/default_reporter';
import NotifyReporter from './reporters/notify_reporter';
import SummaryReporter from './reporters/summary_reporter';
import VerboseReporter from './reporters/verbose_reporter';
import runTest from './run_test';
import TestWatcher from './test_watcher';
import CoverageReporter from './reporters/coverage_reporter';
import ReporterDispatcher from './reporter_dispatcher';

const SLOW_TEST_TIME = 3000;

class CancelRun extends Error {
  constructor(message: ?string) {
    super(message);
    this.name = 'CancelRun';
  }
}

export type TestRunnerOptions = {|
  startRun: (globalConfig: GlobalConfig) => *,
|};

type OnTestFailure = (test: Test, err: TestError) => Promise<*>;
type OnTestSuccess = (test: Test, result: TestResult) => Promise<*>;

const TEST_WORKER_PATH = require.resolve('./test_worker');

class TestRunner {
  _globalConfig: GlobalConfig;
  _options: TestRunnerOptions;
  _dispatcher: ReporterDispatcher;

  constructor(globalConfig: GlobalConfig, options: TestRunnerOptions) {
    this._globalConfig = globalConfig;
    this._dispatcher = new ReporterDispatcher();
    this._options = options;
    this._setupReporters();
  }

  addReporter(reporter: Reporter) {
    this._dispatcher.register(reporter);
  }

  removeReporter(ReporterClass: Function) {
    this._dispatcher.unregister(ReporterClass);
  }

  async runTests(tests: Array<Test>, watcher: TestWatcher) {
    const timings = [];
    const contexts = new Set();
    tests.forEach(test => {
      contexts.add(test.context);
      if (test.duration) {
        timings.push(test.duration);
      }
    });

    const aggregatedResults = createAggregatedResults(tests.length);
    const estimatedTime = Math.ceil(
      getEstimatedTime(timings, this._globalConfig.maxWorkers) / 1000,
    );

    // Run in band if we only have one test or one worker available.
    // If we are confident from previous runs that the tests will finish quickly
    // we also run in band to reduce the overhead of spawning workers.
    const runInBand =
      this._globalConfig.maxWorkers <= 1 ||
      tests.length <= 1 ||
      (tests.length <= 20 &&
        timings.length > 0 &&
        timings.every(timing => timing < SLOW_TEST_TIME));

    const onResult = async (test: Test, testResult: TestResult) => {
      if (watcher.isInterrupted()) {
        return Promise.resolve();
      }
      if (testResult.testResults.length === 0) {
        const message = 'Your test suite must contain at least one test.';
        await onFailure(test, {
          message,
          stack: new Error(message).stack,
        });
        return Promise.resolve();
      }
      addResult(aggregatedResults, testResult);
      await this._dispatcher.onTestResult(test, testResult, aggregatedResults);
      return this._bailIfNeeded(contexts, aggregatedResults, watcher);
    };

    const onFailure = async (test: Test, error: TestError) => {
      if (watcher.isInterrupted()) {
        return;
      }
      const testResult = buildFailureTestResult(test.path, error);
      testResult.failureMessage = formatExecError(
        testResult,
        test.context.config,
        this._globalConfig,
        test.path,
      );
      addResult(aggregatedResults, testResult);
      await this._dispatcher.onTestResult(test, testResult, aggregatedResults);
    };

    const updateSnapshotState = () => {
      contexts.forEach(context => {
        const status = snapshot.cleanup(
          context.hasteFS,
          this._globalConfig.updateSnapshot,
        );
        aggregatedResults.snapshot.filesRemoved += status.filesRemoved;
      });
      const updateAll = this._globalConfig.updateSnapshot === 'all';
      aggregatedResults.snapshot.didUpdate = updateAll;
      aggregatedResults.snapshot.failure = !!(
        !updateAll &&
        (aggregatedResults.snapshot.unchecked ||
          aggregatedResults.snapshot.unmatched ||
          aggregatedResults.snapshot.filesRemoved)
      );
    };

    await this._dispatcher.onRunStart(aggregatedResults, {
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
    await this._dispatcher.onRunComplete(contexts, aggregatedResults);

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

    return aggregatedResults;
  }

  _createInBandTestRun(
    tests: Array<Test>,
    watcher: TestWatcher,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure,
  ) {
    const mutex = throat(1);
    return tests.reduce(
      (promise, test) =>
        mutex(() =>
          promise
            .then(async () => {
              if (watcher.isInterrupted()) {
                throw new CancelRun();
              }

              await this._dispatcher.onTestStart(test);
              return runTest(
                test.path,
                this._globalConfig,
                test.context.config,
                test.context.resolver,
              );
            })
            .then(result => onResult(test, result))
            .catch(err => onFailure(test, err)),
        ),
      Promise.resolve(),
    );
  }

  _createParallelTestRun(
    tests: Array<Test>,
    watcher: TestWatcher,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure,
  ) {
    const farm = workerFarm(
      {
        autoStart: true,
        maxConcurrentCallsPerWorker: 1,
        maxConcurrentWorkers: this._globalConfig.maxWorkers,
        maxRetries: 2, // Allow for a couple of transient errors.
      },
      TEST_WORKER_PATH,
    );
    const mutex = throat(this._globalConfig.maxWorkers);
    const worker = pify(farm);

    // Send test suites to workers continuously instead of all at once to track
    // the start time of individual tests.
    const runTestInWorker = test =>
      mutex(async () => {
        if (watcher.isInterrupted()) {
          return Promise.reject();
        }
        await this._dispatcher.onTestStart(test);
        return worker({
          config: test.context.config,
          globalConfig: this._globalConfig,
          path: test.path,
          rawModuleMap: watcher.isWatchMode()
            ? test.context.moduleMap.getRawModuleMap()
            : null,
        });
      });

    const onError = async (err, test) => {
      await onFailure(test, err);
      if (err.type === 'ProcessTerminatedError') {
        console.error(
          'A worker process has quit unexpectedly! ' +
            'Most likely this is an initialization error.',
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
          .catch(error => onError(error, test)),
      ),
    );

    const cleanup = () => workerFarm.end(farm);
    return Promise.race([runAllTests, onInterrupt]).then(cleanup, cleanup);
  }

  _shouldAddDefaultReporters(reporters?: Array<ReporterConfig>): boolean {
    return (
      !reporters ||
      !!reporters.find(reporterConfig => reporterConfig[0] === 'default')
    );
  }

  _setupReporters() {
    const {collectCoverage, notify, reporters} = this._globalConfig;

    const isDefault = this._shouldAddDefaultReporters(reporters);

    if (isDefault) {
      this._setupDefaultReporters();
    }

    if (reporters && Array.isArray(reporters)) {
      this._addCustomReporters(reporters);
    }

    if (collectCoverage) {
      this.addReporter(new CoverageReporter(this._globalConfig));
    }

    if (notify) {
      this.addReporter(
        new NotifyReporter(this._globalConfig, this._options.startRun),
      );
    }
  }

  _setupDefaultReporters() {
    this.addReporter(
      this._globalConfig.verbose
        ? new VerboseReporter(this._globalConfig)
        : new DefaultReporter(this._globalConfig),
    );

    this.addReporter(new SummaryReporter(this._globalConfig));
  }

  _addCustomReporters(reporters: Array<ReporterConfig>) {
    const customReporters = reporters.filter(
      reporterConfig => reporterConfig[0] !== 'default',
    );

    customReporters.forEach((reporter, index) => {
      const {options, path} = this._getReporterProps(reporter);

      try {
        const Reporter = require(path);
        this.addReporter(new Reporter(this._globalConfig, options));
      } catch (error) {
        throw new Error(
          'An error occurred while adding the reporter at path "' +
            path +
            '".' +
            error.message,
        );
      }
    });
  }

  /**
   * Get properties of a reporter in an object
   * to make dealing with them less painful.
   */
  _getReporterProps(
    reporter: ReporterConfig,
  ): {path: string, options?: Object} {
    if (typeof reporter === 'string') {
      return {options: this._options, path: reporter};
    } else if (Array.isArray(reporter)) {
      const [path, options] = reporter;
      return {options, path};
    }

    throw new Error('Reporter should be either a string or an array');
  }

  _bailIfNeeded(
    contexts: Set<Context>,
    aggregatedResults: AggregatedResult,
    watcher: TestWatcher,
  ) {
    if (this._globalConfig.bail && aggregatedResults.numFailedTests !== 0) {
      if (watcher.isWatchMode()) {
        watcher.setState({interrupted: true});
      } else {
        const exit = () => process.exit(1);
        return this._dispatcher
          .onRunComplete(contexts, aggregatedResults)
          .then(exit)
          .catch(exit);
      }
    }
    return Promise.resolve();
  }
}

const createAggregatedResults = (numTotalTestSuites: number) => {
  const result = makeEmptyAggregatedTestResult();
  result.numTotalTestSuites = numTotalTestSuites;
  result.startTime = Date.now();
  result.success = false;
  return result;
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
