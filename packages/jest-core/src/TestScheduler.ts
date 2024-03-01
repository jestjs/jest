/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import {GITHUB_ACTIONS} from 'ci-info';
import exit = require('exit');
import {
  CoverageReporter,
  DefaultReporter,
  GitHubActionsReporter,
  type BaseReporter as JestReporter,
  NotifyReporter,
  type Reporter,
  type ReporterContext,
  SummaryReporter,
  type SummaryReporterOptions,
  VerboseReporter,
} from '@jest/reporters';
import {
  type AggregatedResult,
  type SerializableError,
  type Test,
  type TestContext,
  type TestResult,
  addResult,
  buildFailureTestResult,
  makeEmptyAggregatedTestResult,
} from '@jest/test-result';
import {createScriptTransformer} from '@jest/transform';
import type {Config} from '@jest/types';
import {formatExecError, separateMessageFromStack} from 'jest-message-util';
import type {JestTestRunner, TestRunnerContext} from 'jest-runner';
import {
  buildSnapshotResolver,
  cleanup as cleanupSnapshots,
} from 'jest-snapshot';
import {ErrorWithStack, invariant, requireOrImportModule} from 'jest-util';
import type {TestWatcher} from 'jest-watcher';
import ReporterDispatcher from './ReporterDispatcher';
import {shouldRunInBand} from './testSchedulerHelper';

export type ReporterConstructor = new (
  globalConfig: Config.GlobalConfig,
  reporterConfig: Record<string, unknown>,
  reporterContext: ReporterContext,
) => JestReporter;

type TestRunnerConstructor = new (
  globalConfig: Config.GlobalConfig,
  testRunnerContext: TestRunnerContext,
) => JestTestRunner;

export type TestSchedulerContext = ReporterContext & TestRunnerContext;

export async function createTestScheduler(
  globalConfig: Config.GlobalConfig,
  context: TestSchedulerContext,
): Promise<TestScheduler> {
  const scheduler = new TestScheduler(globalConfig, context);

  await scheduler._setupReporters();

  return scheduler;
}

class TestScheduler {
  private readonly _context: TestSchedulerContext;
  private readonly _dispatcher: ReporterDispatcher;
  private readonly _globalConfig: Config.GlobalConfig;

  constructor(
    globalConfig: Config.GlobalConfig,
    context: TestSchedulerContext,
  ) {
    this._context = context;
    this._dispatcher = new ReporterDispatcher();
    this._globalConfig = globalConfig;
  }

  addReporter(reporter: Reporter): void {
    this._dispatcher.register(reporter);
  }

  removeReporter(reporterConstructor: ReporterConstructor): void {
    this._dispatcher.unregister(reporterConstructor);
  }

  async scheduleTests(
    tests: Array<Test>,
    watcher: TestWatcher,
  ): Promise<AggregatedResult> {
    const onTestFileStart = this._dispatcher.onTestFileStart.bind(
      this._dispatcher,
    );
    const timings: Array<number> = [];
    const testContexts = new Set<TestContext>();
    for (const test of tests) {
      testContexts.add(test.context);
      if (test.duration) {
        timings.push(test.duration);
      }
    }

    const aggregatedResults = createAggregatedResults(tests.length);
    const estimatedTime = Math.ceil(
      getEstimatedTime(timings, this._globalConfig.maxWorkers) / 1000,
    );

    const runInBand = shouldRunInBand(tests, timings, this._globalConfig);

    const onResult = async (test: Test, testResult: TestResult) => {
      if (watcher.isInterrupted()) {
        return;
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
          `${chalk.red.bold(
            'EXPERIMENTAL FEATURE!\n',
          )}Your test suite is leaking memory. Please ensure all references are cleaned.\n` +
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
      return this._bailIfNeeded(testContexts, aggregatedResults, watcher);
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
        [...testContexts].map(
          async context =>
            [context, await buildSnapshotResolver(context.config)] as const,
        ),
      );

      for (const [context, snapshotResolver] of contextsWithSnapshotResolvers) {
        const status = cleanupSnapshots(
          context.hasteFS,
          this._globalConfig.updateSnapshot,
          snapshotResolver,
          context.config.testPathIgnorePatterns,
        );

        aggregatedResults.snapshot.filesRemoved += status.filesRemoved;
        aggregatedResults.snapshot.filesRemovedList = [
          ...(aggregatedResults.snapshot.filesRemovedList || []),
          ...status.filesRemovedList,
        ];
      }
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

    const testRunners: Record<string, JestTestRunner> = Object.create(null);
    const contextsByTestRunner = new WeakMap<JestTestRunner, TestContext>();

    try {
      await Promise.all(
        [...testContexts].map(async context => {
          const {config} = context;
          if (!testRunners[config.runner]) {
            const transformer = await createScriptTransformer(config);
            const Runner: TestRunnerConstructor =
              await transformer.requireAndTranspileModule(config.runner);
            const runner = new Runner(this._globalConfig, {
              changedFiles: this._context.changedFiles,
              sourcesRelatedToTestsInChangedFiles:
                this._context.sourcesRelatedToTestsInChangedFiles,
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

            if (testRunner.supportsEventEmitters) {
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
                  'test-case-start',
                  ([testPath, testCaseStartInfo]) => {
                    const test: Test = {context, path: testPath};
                    this._dispatcher.onTestCaseStart(test, testCaseStartInfo);
                  },
                ),
                testRunner.on(
                  'test-case-result',
                  ([testPath, testCaseResult]) => {
                    const test: Test = {context, path: testPath};
                    this._dispatcher.onTestCaseResult(test, testCaseResult);
                  },
                ),
              ];

              await testRunner.runTests(tests, watcher, testRunnerOptions);

              for (const sub of unsubscribes) sub();
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
    } catch (error) {
      aggregatedResults.runExecError = buildExecError(error);
      await this._dispatcher.onRunComplete(testContexts, aggregatedResults);
      throw error;
    }

    await updateSnapshotState();
    aggregatedResults.wasInterrupted = watcher.isInterrupted();
    await this._dispatcher.onRunComplete(testContexts, aggregatedResults);

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
    testRunners: Record<string, JestTestRunner>,
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

  async _setupReporters() {
    const {collectCoverage: coverage, notify, verbose} = this._globalConfig;
    const reporters = this._globalConfig.reporters || [['default', {}]];
    let summaryOptions: SummaryReporterOptions | null = null;

    for (const [reporter, options] of reporters) {
      switch (reporter) {
        case 'default':
          summaryOptions = options;
          verbose
            ? this.addReporter(new VerboseReporter(this._globalConfig))
            : this.addReporter(new DefaultReporter(this._globalConfig));
          break;
        case 'github-actions':
          GITHUB_ACTIONS &&
            this.addReporter(
              new GitHubActionsReporter(this._globalConfig, options),
            );
          break;
        case 'summary':
          summaryOptions = options;
          break;
        default:
          await this._addCustomReporter(reporter, options);
      }
    }

    if (notify) {
      this.addReporter(new NotifyReporter(this._globalConfig, this._context));
    }

    if (coverage) {
      this.addReporter(new CoverageReporter(this._globalConfig, this._context));
    }

    if (summaryOptions != null) {
      this.addReporter(new SummaryReporter(this._globalConfig, summaryOptions));
    }
  }

  private async _addCustomReporter(
    reporter: string,
    options: Record<string, unknown>,
  ) {
    try {
      const Reporter: ReporterConstructor =
        await requireOrImportModule(reporter);

      this.addReporter(
        new Reporter(this._globalConfig, options, this._context),
      );
    } catch (error: any) {
      error.message = `An error occurred while adding the reporter at path "${chalk.bold(
        reporter,
      )}".\n${error instanceof Error ? error.message : ''}`;
      throw error;
    }
  }

  private async _bailIfNeeded(
    testContexts: Set<TestContext>,
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
        await this._dispatcher.onRunComplete(testContexts, aggregatedResults);
      } finally {
        const exitCode = this._globalConfig.testFailureExitCode;
        exit(exitCode);
      }
    }
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

const strToError = (errString: string): SerializableError => {
  const {message, stack} = separateMessageFromStack(errString);
  if (stack.length > 0) {
    return {message, stack};
  }
  const error = new ErrorWithStack(message, buildExecError);
  return {message, stack: error.stack || ''};
};

const buildExecError = (err: unknown): SerializableError => {
  if (typeof err === 'string' || err == null) {
    return strToError(err || 'Error');
  }
  const anyErr = err as any;
  if (typeof anyErr.message === 'string') {
    if (typeof anyErr.stack === 'string' && anyErr.stack.length > 0) {
      return anyErr;
    }
    return strToError(anyErr.message);
  }
  return strToError(JSON.stringify(err));
};
