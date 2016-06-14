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

export type AssertionResult = {
  title: string,
  status: 'passed' | 'failed' | 'skipped',
  ancestorTitles: Array<string>,
  failureMessages: Array<string>,
  numPassingAsserts: number,
};

export type TestResult = {
  coverage: ?Coverage,
  hasUncheckedKeys: boolean,
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
  testExecError: {
    message: string,
    stack: string,
  },
  testFilePath: string,
  testResults: Array<AssertionResult>,
};
