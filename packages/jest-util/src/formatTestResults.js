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

import type {
  AggregatedResult,
  CodeCoverageFormatter,
  CodeCoverageReporter,
  TestResult,
  AssertionResult,
} from 'types/TestResult';

const formatResult = (
  testResult: TestResult,
  codeCoverageFormatter: CodeCoverageFormatter,
  reporter: CodeCoverageReporter,
): Object => {
  const output = ({
    message: '',
    name: testResult.testFilePath,
    summary: '',
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
  }

  output.assertionResults = testResult.testResults.map(formatTestAssertion);

  if (testResult.failureMessage) {
    output.message = testResult.failureMessage;
  }

  return output;
};

function formatTestAssertion(
  assertion: AssertionResult,
): Object {
  const result: any = {
    status: assertion.status,
    title: assertion.title,
  };
  if (assertion.failureMessages) {
    result.failureMessages = assertion.failureMessages;
  }
  return result;
}

function formatTestResults(
  results: AggregatedResult,
  codeCoverageFormatter?: CodeCoverageFormatter,
  reporter?: CodeCoverageReporter,
): Object {
  const formatter = codeCoverageFormatter || (coverage => coverage);

  const testResults = results.testResults.map(testResult => formatResult(
    testResult,
    formatter,
    reporter,
  ));

  return Object.assign({}, results, {
    numFailedTests: results.numFailedTests,
    numPassedTests: results.numPassedTests,
    numPendingTests: results.numPendingTests,
    numRuntimeErrorTestSuites: results.numRuntimeErrorTestSuites,
    numTotalTestSuites: results.numTotalTestSuites,
    numTotalTests: results.numTotalTests,
    startTime: results.startTime,
    success: results.success,
    testResults,
  });
}

module.exports = formatTestResults;
