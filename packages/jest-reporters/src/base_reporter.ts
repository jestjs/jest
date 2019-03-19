/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {AggregatedResult, TestResult} from '@jest/test-result';
import {preRunMessage} from 'jest-util';
import {ReporterOnStartOptions, Context, Test, Reporter} from './types';

const {remove: preRunMessageRemove} = preRunMessage;

export default class BaseReporter implements Reporter {
  private _error?: Error;

  log(message: string) {
    process.stderr.write(message + '\n');
  }

  onRunStart(_results: AggregatedResult, _options: ReporterOnStartOptions) {
    preRunMessageRemove(process.stderr);
  }

  onTestResult(
    _test: Test,
    _testResult: TestResult,
    _results: AggregatedResult,
  ) {}

  onTestStart(_test: Test) {}

  onRunComplete(
    _contexts: Set<Context>,
    _aggregatedResults: AggregatedResult,
  ): Promise<void> | void {}

  protected _setError(error: Error) {
    this._error = error;
  }

  // Return an error that occurred during reporting. This error will
  // define whether the test run was successful or failed.
  getLastError() {
    return this._error;
  }
}
