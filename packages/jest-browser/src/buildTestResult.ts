/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {AssertionResult, Test, TestResult} from '@jest/test-result';
import type {TestResult as BrowserTestResult} from './rpc';

/**
 * Convert browser test results to Jest's TestResult format.
 */
export function buildTestResult(
  test: Test,
  browserResult: BrowserTestResult,
): TestResult {
  const testContext = test.context;
  const projectConfig = testContext.config;

  const testResults: Array<AssertionResult> = browserResult.results.map(
    (r: BrowserTestResult['results'][number]) => ({
      ancestorTitles: r.name.includes(' > ')
        ? r.name.split(' > ').slice(0, -1)
        : [],
      duration: r.duration,
      failureDetails: r.error != null && r.error !== '' ? [r.error] : [],
      failureMessages:
        r.error != null && r.error !== ''
          ? [
              r.stack != null && r.stack !== ''
                ? `${r.error}\n${r.stack}`
                : r.error,
            ]
          : [],
      fullName: r.name,
      numPassingAsserts: r.status === 'passed' ? 1 : 0,
      status: r.status === 'skipped' ? 'pending' : r.status,
      title: r.name.includes(' > ')
        ? (r.name.split(' > ').pop() ?? r.name)
        : r.name,
    }),
  );

  const totalDuration = testResults.reduce(
    (sum, r) => sum + (r.duration ?? 0),
    0,
  );

  const failureMessageText = testResults
    .filter(r => r.status === 'failed')
    .map(r => r.failureMessages.join('\n'))
    .join('\n\n');

  return {
    console: undefined,
    coverage: undefined,
    displayName: projectConfig.displayName,
    failureMessage: failureMessageText === '' ? undefined : failureMessageText,
    leaks: false,
    numFailingTests: browserResult.failed,
    numPassingTests: browserResult.passed,
    numPendingTests: testResults.filter(r => r.status === 'pending').length,
    numTodoTests: 0,
    openHandles: [],
    perfStats: {
      end: Date.now(),
      loadTestEnvironmentEnd: 0,
      loadTestEnvironmentStart: 0,
      runtime: totalDuration,
      setupAfterEnvEnd: 0,
      setupAfterEnvStart: 0,
      setupFilesEnd: 0,
      setupFilesStart: 0,
      slow: totalDuration > 5000,
      start: Date.now() - totalDuration,
    },
    skipped: false,
    snapshot: {
      added: 0,
      fileDeleted: false,
      matched: 0,
      unchecked: 0,
      uncheckedKeys: [],
      unmatched: 0,
      updated: 0,
    },
    testExecError: undefined,
    testFilePath: test.path,
    testResults,
    v8Coverage: undefined,
  };
}
