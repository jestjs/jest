/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {TestResult} from '@jest/types';
import {preRunMessage} from 'jest-util';
import {ReporterOnStartOptions, Context, Test, Reporter} from './types';

const {remove: preRunMessageRemove} = preRunMessage;

export default class BaseReporter implements Reporter {
  _error?: Error;

  log(message: string) {
    process.stderr.write(message + '\n');
  }

  onRunStart(
    results: TestResult.AggregatedResult,
    options: ReporterOnStartOptions,
  ) {
    preRunMessageRemove(process.stderr);
  }

  onTestResult(
    test: Test,
    testResult: TestResult.TestResult,
    results: TestResult.AggregatedResult,
  ) {}

  onTestStart(test: Test) {}

  onRunComplete(
    contexts: Set<Context>,
    aggregatedResults: TestResult.AggregatedResult,
  ): Promise<void> | void {}

  _setError(error: Error) {
    this._error = error;
  }

  // Return an error that occurred during reporting. This error will
  // define whether the test run was successful or failed.
  getLastError() {
    return this._error;
  }
}
