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

import type {ConsoleBuffer} from './Console';

export type Coverage = Object;

export type Error = {
  message: string,
  stack: ?string,
  type?: ?string,
};

export type FailedAssertion = {
  matcherName: string,
  message?: string,
  actual?: any,
  pass?: boolean,
  expected?: any,
  isNot?: boolean,
  stack?: string,
};

export type Status = 'passed' | 'failed' | 'skipped' | 'pending';

export type Bytes = number;
export type Milliseconds = number;

export type AssertionResult = {
  title: string,
  status: Status,
  ancestorTitles: Array<string>,
  failureMessages: Array<string>,
  numPassingAsserts: number,
  duration?: Milliseconds,
};

export type AggregatedResult = {
  numFailedTests: number,
  numFailedTestSuites: number,
  numPassedTests: number,
  numPassedTestSuites: number,
  numPendingTests: number,
  numRuntimeErrorTestSuites: number,
  numTotalTests: number,
  numTotalTestSuites: number,
  snapshot: SnapshotSummary,
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
  console?: ConsoleBuffer,
  coverage?: Coverage,
  memoryUsage?: Bytes,
  failureMessage: ?string,
  numFailingTests: number,
  numPassingTests: number,
  numPendingTests: number,
  perfStats: {
    end: Milliseconds,
    start: Milliseconds,
  },
  snapshot: {
    added: number,
    fileDeleted: boolean,
    matched: number,
    unchecked: number,
    unmatched: number,
    updated: number,
  },
  testExecError: Error,
  testFilePath: string,
  testResults: Array<AssertionResult>,
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


export type SnapshotSummary = {
  added: number,
  didUpdate: boolean,
  failure: boolean,
  filesAdded: number,
  filesRemoved: number,
  filesUnmatched: number,
  filesUpdated: number,
  matched: number,
  total: number,
  unchecked: number,
  unmatched: number,
  updated: number,
};
