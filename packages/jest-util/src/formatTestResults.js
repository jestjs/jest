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
  AssertionResult,
  CodeCoverageFormatter,
  CodeCoverageReporter,
  FormattedAssertionResult,
  FormattedTestResult,
  FormattedTestResults,
  TestResult,
} from 'types/TestResult';

const formatResult = (
  testResult: TestResult,
  codeCoverageFormatter: CodeCoverageFormatter,
  reporter: CodeCoverageReporter,
): FormattedTestResult => {
  const now = Date.now();
  const output: FormattedTestResult = {
    assertionResults: [],
    coverage: {},
    endTime: now,
    message: '',
    name: testResult.testFilePath,
    startTime: now,
    status: 'failed',
    summary: '',
  };

  if (testResult.testExecError) {
    output.message = testResult.testExecError.message;
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
): FormattedAssertionResult {
  const result: FormattedAssertionResult = {
    failureMessages: null,
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
): FormattedTestResults {
  const formatter = codeCoverageFormatter || (coverage => coverage);

  const testResults = results.testResults.map(testResult =>
    formatResult(testResult, formatter, reporter),
  );

  return Object.assign((Object.create(null): any), results, {
    testResults,
  });
}

module.exports = formatTestResults;
