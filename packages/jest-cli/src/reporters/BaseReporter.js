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
import type {Context} from 'types/Context';
import type {Test} from 'types/TestRunner';
import type {ReporterOnStartOptions} from 'types/Reporters';

const preRunMessage = require('../preRunMessage');

class BaseReporter {
  _error: ?Error;

  log(message: string) {
    process.stderr.write(message + '\n');
  }

  onRunStart(results: AggregatedResult, options: ReporterOnStartOptions) {
    preRunMessage.remove(process.stderr);
  }

  onTestResult(test: Test, testResult: TestResult, results: AggregatedResult) {}

  onTestStart(test: Test) {}

  onRunComplete(
    contexts: Set<Context>,
    aggregatedResults: AggregatedResult,
  ): ?Promise<void> {}

  _setError(error: Error) {
    this._error = error;
  }

  // Return an error that occurred during reporting. This error will
  // define whether the test run was successful or failed.
  getLastError(): ?Error {
    return this._error;
  }
}

module.exports = BaseReporter;
