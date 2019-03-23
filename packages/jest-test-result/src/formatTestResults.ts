/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  AggregatedResult,
  AssertionResult,
  CodeCoverageFormatter,
  CodeCoverageReporter,
  FormattedAssertionResult,
  FormattedTestResult,
  FormattedTestResults,
  TestResult,
} from './types';

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
    ancestorTitles: assertion.ancestorTitles,
    failureMessages: null,
    fullName: assertion.fullName,
    location: assertion.location,
    status: assertion.status,
    title: assertion.title,
  };
  if (assertion.failureMessages) {
    result.failureMessages = assertion.failureMessages;
  }
  return result;
}

export default function formatTestResults(
  results: AggregatedResult,
  codeCoverageFormatter?: CodeCoverageFormatter | null,
  reporter?: CodeCoverageReporter,
): FormattedTestResults {
  const formatter = codeCoverageFormatter || (coverage => coverage);

  const testResults = results.testResults.map(testResult =>
    formatResult(testResult, formatter, reporter),
  );

  return {...results, testResults};
}
