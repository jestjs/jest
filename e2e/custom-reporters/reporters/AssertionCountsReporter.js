/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

class AssertionCountsReporter {
  onTestFileResult(test, testResult, aggregatedResult) {
    for (const [index, testCaseResult] of testResult.testResults.entries()) {
      console.log(
        `onTestFileResult testCaseResult ${index}: ${testCaseResult.title}, ` +
          `status: ${testCaseResult.status}, ` +
          `numExpectations: ${testCaseResult.numPassingAsserts}`,
      );
    }
  }
  onTestCaseResult(test, testCaseResult) {
    const difference = new Date(
      Date.now() - testCaseResult.startedAt,
    ).getDate();
    console.log(
      `onTestCaseResult: ${testCaseResult.title}, ` +
        `started: ${difference === 1 ? 'today' : 'invalid'}, ` +
        `status: ${testCaseResult.status}, ` +
        `numExpectations: ${testCaseResult.numPassingAsserts}`,
    );
  }
}

module.exports = AssertionCountsReporter;
