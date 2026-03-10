/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  AggregatedResult,
  Test,
  TestCaseResult,
  TestResult,
} from '@jest/test-result';
import BaseReporter from './BaseReporter';
import DefaultReporter from './DefaultReporter';
import type {ReporterOnStartOptions} from './types';

/**
 * A reporter optimized for AI coding agents that reduces token usage by only
 * printing failing tests and the final summary. Automatically activated when
 * an AI agent environment is detected (via the AI_AGENT env var or std-env).
 */
export default class AgentReporter extends DefaultReporter {
  static override readonly filename = __filename;

  /* eslint-disable @typescript-eslint/no-empty-function */
  protected override __wrapStdio(): void {}
  protected override __clearStatus(): void {}
  protected override __printStatus(): void {}
  override onTestStart(_test: Test): void {}
  override onTestCaseResult(
    _test: Test,
    _testCaseResult: TestCaseResult,
  ): void {}
  /* eslint-enable */

  override onRunStart(
    aggregatedResults: AggregatedResult,
    options: ReporterOnStartOptions,
  ): void {
    BaseReporter.prototype.onRunStart.call(this, aggregatedResults, options);
  }

  override onTestResult(
    test: Test,
    testResult: TestResult,
    aggregatedResults: AggregatedResult,
  ): void {
    this.testFinished(test.context.config, testResult, aggregatedResults);

    // Only print output for test files that have failures.
    if (
      !testResult.skipped &&
      (testResult.numFailingTests > 0 || testResult.testExecError)
    ) {
      this.printTestFileHeader(
        testResult.testFilePath,
        test.context.config,
        testResult,
      );
      this.printTestFileFailureMessage(
        testResult.testFilePath,
        test.context.config,
        testResult,
      );
    }

    this.forceFlushBufferedOutput();
  }
}
