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
  TestContext,
  TestResult,
} from '@jest/test-result';
import {preRunMessage} from 'jest-util';
import type {Reporter, ReporterOnStartOptions} from './types';

const {remove: preRunMessageRemove} = preRunMessage;

export default class BaseReporter implements Reporter {
  private _error?: Error;

  log(message: string): void {
    process.stderr.write(`${message}\n`);
  }

  onRunStart(
    _results?: AggregatedResult,
    _options?: ReporterOnStartOptions,
  ): void {
    preRunMessageRemove(process.stderr);
  }

  /* eslint-disable @typescript-eslint/no-empty-function */
  onTestCaseResult(_test: Test, _testCaseResult: TestCaseResult): void {}

  onTestResult(
    _test?: Test,
    _testResult?: TestResult,
    _results?: AggregatedResult,
  ): void {}

  onTestStart(_test?: Test): void {}

  onRunComplete(
    _testContexts?: Set<TestContext>,
    _aggregatedResults?: AggregatedResult,
  ): Promise<void> | void {}
  /* eslint-enable */

  protected _setError(error: Error): void {
    this._error = error;
  }

  // Return an error that occurred during reporting. This error will
  // define whether the test run was successful or failed.
  getLastError(): Error | undefined {
    return this._error;
  }
}
