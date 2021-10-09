/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable local/ban-types-eventually */

import chalk = require('chalk');
import exit = require('exit');
import {
  CoverageReporter,
  DefaultReporter,
  NotifyReporter,
  Reporter,
  SummaryReporter,
  VerboseReporter,
} from '@jest/reporters';
import {
  AggregatedResult,
  SerializableError,
  Test,
  TestResult,
  addResult,
  buildFailureTestResult,
  makeEmptyAggregatedTestResult,
} from '@jest/test-result';
import {createScriptTransformer} from '@jest/transform';
import type {Config} from '@jest/types';
import {formatExecError} from 'jest-message-util';
import type TestRunner from 'jest-runner';
import type {Context} from 'jest-runtime';
import snapshot = require('jest-snapshot');
import {requireOrImportModule} from 'jest-util';
import ReporterDispatcher from './ReporterDispatcher';
import type TestWatcher from './TestWatcher';
import {shouldRunInBand} from './testSchedulerHelper';

export type TestSchedulerOptions = {
  startRun: (globalConfig: Config.GlobalConfig) => void;
};
export type TestSchedulerContext = {
  firstRun: boolean;
  previousSuccess: boolean;
  changedFiles?: Set<Config.Path>;
  sourcesRelatedToTestsInChangedFiles?: Set<Config.Path>;
};

export async function createTestScheduler(
  globalConfig: Config.GlobalConfig,
  options: TestSchedulerOptions,
  context: TestSchedulerContext,
): Promise<TestScheduler> {
  const scheduler = new TestScheduler(globalConfig, options, context);

  await scheduler._setupReporters();

  return scheduler;
}

class TestScheduler {
  private readonly _dispatcher: ReporterDispatcher;
  private readonly _globalConfig: Config.GlobalConfig;
  private readonly _options: TestSchedulerOptions;
  private readonly _context: TestSchedulerContext;

  constructor(
    globalConfig: Config.GlobalConfig,
    options: TestSchedulerOptions,
    context: TestSchedulerContext,
  ) {
    this._dispatcher = new ReporterDispatcher();
    this._globalConfig = globalConfig;
    this._options = options;
    this._context = context;
  }

  addReporter(reporter: Reporter): void {
    this._dispatcher.register(reporter);
  }

  removeReporter(ReporterClass: Function): void {
    this._dispatcher.unregister(ReporterClass);
  }

  async scheduleTests(
    tests: Array<Test>,
    watcher: TestWatcher,
  ): Promise<AggregatedResult> {
    const onTestFileStart = this._dispatcher.onTestFileStart.bind(
      this._dispatcher,
    );
    const timings: Array<number> = [];
    const contexts = new Set<Context>();
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

    const runInBand = shouldRunInBand(tests, timings, this._globalConfig);

    const onResult = async (test: Test, testResult: TestResult) => {
      if (watcher.isInterrupted()) {
        return Promise.resolve();
      }

      if (testResult.testResults.length === 0) {
        const message = 'Your test suite must contain at least one test.';

        return onFailure(test, {
          message,
          stack: new Error(message).stack,
        });
      }

      // Throws when the context is leaked after executing a test.
      if (testResult.leaks) {
        const message =
          chalk.red.bold('EXPERIMENTAL FEATURE!\n') +
          'Your test suite is leaking memory. Please ensure all references are cleaned.\n' +
          '\n' +
          'There is a number of things that can leak memory:\n' +
          '  - Async operations that have not finished (e.g. fs.readFile).\n' +
          '  - Timers not properly mocked (e.g. setInterval, setTimeout).\n' +
          '  - Keeping references to the global scope.';

        return onFailure(test, {
          message,
          stack: new Error(message).stack,
        });
      }

      addResult(aggregatedResults, testResult);
      await this._dispatcher.onTestFileResult(
        test,
        testResult,
        aggregatedResults,
      );
      return this._bailIfNeeded(contexts, aggregatedResults, watcher);
    };

    const onFailure = async (test: Test, error: SerializableError) => {
      if (watcher.isInterrupted()) {
        return;
      }
      const testResult = buildFailureTestResult(test.path, error);
      testResult.failureMessage = formatExecError(
        testResult.testExecError,
        test.context.config,
        this._globalConfig,
        test.path,
      );
      addResult(aggregatedResults, testResult);
      await this._dispatcher.onTestFileResult(
        test,
        testResult,
        aggregatedResults,
      );
    };

    const updateSnapshotState = async () => {
      const contextsWithSnapshotResolvers = await Promise.all(
        Array.from(contexts).map(
          async context =>
            [
              context,
              await snapshot.buildSnapshotResolver(context.config),
            ] as const,
        ),
      );

      contextsWithSnapshotResolvers.forEach(([context, snapshotResolver]) => {
        const status = snapshot.cleanup(
          context.hasteFS,
          this._globalConfig.updateSnapshot,
          snapshotResolver,
          context.config.testPathIgnorePatterns,
        );

        aggregatedResults.snapshot.filesRemoved += status.filesRemoved;
        aggregatedResults.snapshot.filesRemovedList = (
          aggregatedResults.snapshot.filesRemovedList || []
        ).concat(status.filesRemovedList);
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

    const testRunners: {[key: string]: TestRunner} = Object.create(null);
    const contextsByTestRunner = new WeakMap<TestRunner, Context>();
    await Promise.all(
      Array.from(contexts).map(async context => {
        const {config} = context;
        if (!testRunners[config.runner]) {
          const transformer = await createScriptTransformer(config);
          const Runner: typeof TestRunner =
            await transformer.requireAndTranspileModule(config.runner);
          const runner = new Runner(this._globalConfig, {
            changedFiles: this._context?.changedFiles,
            sourcesRelatedToTestsInChangedFiles:
              this._context?.sourcesRelatedToTestsInChangedFiles,
          });
          testRunners[config.runner] = runner;
          contextsByTestRunner.set(runner, context);
        }
      }),
    );

    const testsByRunner = this._partitionTests(testRunners, tests);

    if (testsByRunner) {
      try {
        for (const runner of Object.keys(testRunners)) {
          const testRunner = testRunners[runner];
          const context = contextsByTestRunner.get(testRunner);

          invariant(context);

          const tests = testsByRunner[runner];

          const testRunnerOptions = {
            serial: runInBand || Boolean(testRunner.isSerial),
          };

          /**
           * Test runners with event emitters are still not supported
           * for third party test runners.
           */
          if (testRunner.__PRIVATE_UNSTABLE_API_supportsEventEmitters__) {
            const unsubscribes = [
              testRunner.on('test-file-start', ([test]) =>
                onTestFileStart(test),
              ),
              testRunner.on('test-file-success', ([test, testResult]) =>
                onResult(test, testResult),
              ),
              testRunner.on('test-file-failure', ([test, error]) =>
                onFailure(test, error),
              ),
              testRunner.on(
                'test-case-result',
                ([testPath, testCaseResult]) => {
                  const test: Test = {context, path: testPath};
                  this._dispatcher.onTestCaseResult(test, testCaseResult);
                },
              ),
            ];

            await testRunner.runTests(
              tests,
              watcher,
              undefined,
              undefined,
              undefined,
              testRunnerOptions,
            );

            unsubscribes.forEach(sub => sub());
          } else {
            await testRunner.runTests(
              tests,
              watcher,
              onTestFileStart,
              onResult,
              onFailure,
              testRunnerOptions,
            );
          }
        }
      } catch (error) {
        if (!watcher.isInterrupted()) {
          throw error;
        }
      }
    }

    await updateSnapshotState();
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

  private _partitionTests(
    testRunners: Record<string, TestRunner>,
    tests: Array<Test>,
  ): Record<string, Array<Test>> | null {
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

  private _shouldAddDefaultReporters(
    reporters?: Array<string | Config.ReporterConfig>,
  ): boolean {
    return (
      !reporters ||
      !!reporters.find(
        reporter => this._getReporterProps(reporter).path === 'default',
      )
    );
  }

  async _setupReporters() {
    const {collectCoverage, notify, reporters} = this._globalConfig;
    const isDefault = this._shouldAddDefaultReporters(reporters);

    if (isDefault) {
      this._setupDefaultReporters(collectCoverage);
    }

    if (!isDefault && collectCoverage) {
      this.addReporter(
        new CoverageReporter(this._globalConfig, {
          changedFiles: this._context?.changedFiles,
          sourcesRelatedToTestsInChangedFiles:
            this._context?.sourcesRelatedToTestsInChangedFiles,
        }),
      );
    }

    if (notify) {
      this.addReporter(
        new NotifyReporter(
          this._globalConfig,
          this._options.startRun,
          this._context,
        ),
      );
    }

    if (reporters && Array.isArray(reporters)) {
      await this._addCustomReporters(reporters);
    }
  }

  private _setupDefaultReporters(collectCoverage: boolean) {
    this.addReporter(
      this._globalConfig.verbose
        ? new VerboseReporter(this._globalConfig)
        : new DefaultReporter(this._globalConfig),
    );

    if (collectCoverage) {
      this.addReporter(
        new CoverageReporter(this._globalConfig, {
          changedFiles: this._context?.changedFiles,
          sourcesRelatedToTestsInChangedFiles:
            this._context?.sourcesRelatedToTestsInChangedFiles,
        }),
      );
    }

    this.addReporter(new SummaryReporter(this._globalConfig));
  }

  private async _addCustomReporters(
    reporters: Array<string | Config.ReporterConfig>,
  ) {
    for (const reporter of reporters) {
      const {options, path} = this._getReporterProps(reporter);

      if (path === 'default') continue;

      try {
        const Reporter = await requireOrImportModule<any>(path, true);
        this.addReporter(new Reporter(this._globalConfig, options));
      } catch (error) {
        error.message =
          'An error occurred while adding the reporter at path "' +
          chalk.bold(path) +
          '".' +
          error.message;
        throw error;
      }
    }
  }

  /**
   * Get properties of a reporter in an object
   * to make dealing with them less painful.
   */
  private _getReporterProps(reporter: string | Config.ReporterConfig): {
    path: string;
    options: Record<string, unknown>;
  } {
    if (typeof reporter === 'string') {
      return {options: this._options, path: reporter};
    } else if (Array.isArray(reporter)) {
      const [path, options] = reporter;
      return {options, path};
    }

    throw new Error('Reporter should be either a string or an array');
  }

  private async _bailIfNeeded(
    contexts: Set<Context>,
    aggregatedResults: AggregatedResult,
    watcher: TestWatcher,
  ): Promise<void> {
    if (
      this._globalConfig.bail !== 0 &&
      aggregatedResults.numFailedTests >= this._globalConfig.bail
    ) {
      if (watcher.isWatchMode()) {
        await watcher.setState({interrupted: true});
        return;
      }

      try {
        await this._dispatcher.onRunComplete(contexts, aggregatedResults);
      } finally {
        const exitCode = this._globalConfig.testFailureExitCode;
        exit(exitCode);
      }
    }
  }
}

function invariant(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const createAggregatedResults = (numTotalTestSuites: number) => {
  const result = makeEmptyAggregatedTestResult();
  result.numTotalTestSuites = numTotalTestSuites;
  result.startTime = Date.now();
  result.success = false;
  return result;
};

const getEstimatedTime = (timings: Array<number>, workers: number) => {
  if (timings.length === 0) {
    return 0;
  }

  const max = Math.max(...timings);
  return timings.length <= workers
    ? max
    : Math.max(timings.reduce((sum, time) => sum + time) / workers, max);
};
