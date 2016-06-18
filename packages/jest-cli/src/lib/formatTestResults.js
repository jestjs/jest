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

const utils = require('jest-util');

import type {
  AggregatedTestResults,
  CodeCoverageFormatter,
  CodeCoverageReporter,
  TestResult,
} from 'types/TestResult';
import type {Config} from 'types/Config';

const formatResult = (
  testResult: TestResult,
  config: Config,
  codeCoverageFormatter: CodeCoverageFormatter,
  reporter: CodeCoverageReporter,
): Object => {
  const output = ({
    name: testResult.testFilePath,
    summary: '',
    message: '',
  }: any);

  if (testResult.testExecError) {
    const currTime = Date.now();
    output.status = 'failed';
    output.message = testResult.testExecError;
    output.startTime = currTime;
    output.endTime = currTime;
    output.coverage = {};
  } else {
    const allTestsPassed = testResult.numFailingTests === 0;
    output.status = allTestsPassed ? 'passed' : 'failed';
    output.startTime = testResult.perfStats.start;
    output.endTime = testResult.perfStats.end;
    output.coverage = codeCoverageFormatter(testResult.coverage, reporter);

    if (!allTestsPassed) {
      output.message = utils.formatFailureMessage(testResult, {
        noStackTrace: config.noStackTrace,
        rootDir: config.rootDir,
        verbose: false,
      });
    }
  }

  return output;
};

function formatTestResults(
  results: AggregatedTestResults,
  config: Config,
  codeCoverageFormatter?: CodeCoverageFormatter,
  reporter?: CodeCoverageReporter,
): Object {
  const formatter = codeCoverageFormatter || (coverage => coverage);

  const testResults = results.testResults.map(testResult => formatResult(
    testResult,
    config,
    formatter,
    reporter
  ));

  return {
    success: results.success,
    startTime: results.startTime,
    numTotalTests: results.numTotalTests,
    numTotalTestSuites: results.numTotalTestSuites,
    numRuntimeErrorTestSuites: results.numRuntimeErrorTestSuites,
    numPassedTests: results.numPassedTests,
    numFailedTests: results.numFailedTests,
    numPendingTests: results.numPendingTests,
    testResults,
  };
}

module.exports = formatTestResults;
