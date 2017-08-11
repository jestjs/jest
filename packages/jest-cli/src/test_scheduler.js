/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {AggregatedResult, TestResult} from 'types/TestResult';
import type {GlobalConfig, ReporterConfig} from 'types/Config';
import type {Context} from 'types/Context';
import type {Reporter, Test} from 'types/TestRunner';

import {formatExecError} from 'jest-message-util';
import {
  addResult,
  buildFailureTestResult,
  makeEmptyAggregatedTestResult,
} from './test_result_helpers';
import CoverageReporter from './reporters/coverage_reporter';
import DefaultReporter from './reporters/default_reporter';
import NotifyReporter from './reporters/notify_reporter';
import ReporterDispatcher from './reporter_dispatcher';
import snapshot from 'jest-snapshot';
import SummaryReporter from './reporters/summary_reporter';
import TestRunner from 'jest-runner';
import TestWatcher from './test_watcher';
import VerboseReporter from './reporters/verbose_reporter';

const SLOW_TEST_TIME = 3000;

// The default jest-runner is required because it is the default test runner
// and required implicitly through the `runner` ProjectConfig option.
TestRunner;

export type TestSchedulerOptions = {|
  startRun: (globalConfig: GlobalConfig) => *,
|};

class TestScheduler {
  _dispatcher: ReporterDispatcher;
  _globalConfig: GlobalConfig;
  _options: TestSchedulerOptions;

  constructor(globalConfig: GlobalConfig, options: TestSchedulerOptions) {
    this._dispatcher = new ReporterDispatcher();
    this._globalConfig = globalConfig;
    this._options = options;
    this._setupReporters();
  }

  addReporter(reporter: Reporter) {
    this._dispatcher.register(reporter);
  }

  removeReporter(ReporterClass: Function) {
    this._dispatcher.unregister(ReporterClass);
  }

  async scheduleTests(tests: Array<Test>, watcher: TestWatcher) {
    const onStart = this._dispatcher.onTestStart.bind(this._dispatcher);
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

    const onFailure = async (test, error) => {
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

    const testRunners = Object.create(null);
    contexts.forEach(({config}) => {
      if (!testRunners[config.runner]) {
        // $FlowFixMe
        testRunners[config.runner] = new (require(config.runner): TestRunner)(
          this._globalConfig,
        );
      }
    });

    const testsByRunner = this._partitionTests(testRunners, tests);

    if (testsByRunner) {
      try {
        for (const runner of Object.keys(testRunners)) {
          await testRunners[runner].runTests(
            testsByRunner[runner],
            watcher,
            onStart,
            onResult,
            onFailure,
            {
              serial: runInBand,
            },
          );
        }
      } catch (error) {
        if (!watcher.isInterrupted()) {
          throw error;
        }
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

  _partitionTests(
    testRunners: {[key: string]: TestRunner},
    tests: Array<Test>,
  ) {
    if (Object.keys(testRunners).length > 1) {
      return tests.reduce((testRuns, test) => {
        const runner = test.context.config.runner;
        if (!testRuns[runner]) {
          testRuns[runner] = [];
        }
        testRuns[runner].push(test);
        return testRuns;
      }, Object.create(null));
    } else if (tests.length > 0 && tests[0] != null) {
      // If there is only one runner, don't partition the tests.
      return Object.assign(Object.create(null), {
        [tests[0].context.config.runner]: tests,
      });
    } else {
      return null;
    }
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

    if (collectCoverage) {
      this.addReporter(new CoverageReporter(this._globalConfig));
    }

    if (notify) {
      this.addReporter(
        new NotifyReporter(this._globalConfig, this._options.startRun),
      );
    }

    if (reporters && Array.isArray(reporters)) {
      this._addCustomReporters(reporters);
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
        // $FlowFixMe
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

module.exports = TestScheduler;
