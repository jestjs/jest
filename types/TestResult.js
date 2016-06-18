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

export type Coverage = Object;

export type Error = {
  message: string,
  stack: ?string,
  type?: ?string,
};

export type FailedAssertion = {
  matcherName: string,
  message?: string,
  trace?: Error,
  actual?: any,
  pass?: boolean,
  expected?: any,
  isNot?: boolean,
};

export type Status = 'passed' | 'failed' | 'skipped' | 'pending';

export type AssertionResult = {
  title: string,
  status: Status,
  ancestorTitles: Array<string>,
  failureMessages: Array<string>,
  numPassingAsserts: number,
};

export type AggregatedResult = {
  didUpdate: boolean,
  numFailedTests: number,
  numFailedTestSuites: number,
  numPassedTests: number,
  numPassedTestSuites: number,
  numPendingTests: number,
  numRuntimeErrorTestSuites: number,
  numTotalTests: number,
  numTotalTestSuites: number,
  snapshotFilesRemoved: number,
  startTime: number,
  success: boolean,
  testResults: Array<TestResult>,
};

export type Suite = {
  title: string,
  suites: Array<Suite>,
  tests: Array<AssertionResult>,
};

export type TestResult = {
  coverage?: Coverage,
  hasUncheckedKeys: boolean,
  message?: string,
  numFailingTests: number,
  numPassingTests: number,
  numPendingTests: number,
  perfStats: {
    end: number,
    start: number,
  },
  snapshotFileDeleted: boolean,
  snapshotsAdded: number,
  snapshotsMatched: number,
  snapshotsUnmatched: number,
  snapshotsUpdated: number,
  testExecError: Error,
  testFilePath: string,
  testResults: Array<AssertionResult>,
};

export type AggregatedTestResults = {
  success: ?boolean,
  startTime: Date,
  numTotalTestSuites: number,
  numPassedTestSuites: number,
  numFailedTestSuites: number,
  numRuntimeErrorTestSuites: number,
  numTotalTests: number,
  numPassedTests: number,
  numFailedTests: number,
  numPendingTests: number,
  testResults: Array<TestResult>,
};

export type CodeCoverageResult = {
  coveredSpans: Array<Object>,
  uncoveredSpans: Array<Object>,
  sourceText: string,
};

export type CodeCoverageReporter = any;

export type CodeCoverageFormatter = (
  coverage: ?CodeCoverageResult,
  reporter?: CodeCoverageReporter,
) => ?Object;
