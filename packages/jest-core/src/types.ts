/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Context} from 'jest-runtime';
import {Test} from 'jest-runner';
import {TestResult} from '@jest/types';

export type TestRunData = Array<{
  context: Context;
  matches: {allTests: number; tests: Array<Test>; total?: number};
}>;

// TODO: Obtain this from @jest/reporters once its been migrated
export type ReporterOnStartOptions = {
  estimatedTime: number;
  showStatus: boolean;
};

export type Reporter = {
  onTestResult: (
    test: Test,
    testResult: TestResult.TestResult,
    aggregatedResult: TestResult.AggregatedResult,
  ) => Promise<void>;
  onRunStart: (
    results: TestResult.AggregatedResult,
    options: ReporterOnStartOptions,
  ) => Promise<void>;
  onTestStart: (test: Test) => Promise<void>;
  onRunComplete: (
    contexts: Set<Context>,
    results: TestResult.AggregatedResult,
  ) => Promise<void>;
  getLastError: () => Error;
};
