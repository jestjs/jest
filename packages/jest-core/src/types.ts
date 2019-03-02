/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Context} from 'jest-runtime';
import {Test} from 'jest-runner';
import {Config, TestResult} from '@jest/types';

export type TestRunData = Array<{
  context: Context;
  matches: {
    allTests: number;
    tests: Array<Test>;
    total?: number;
    stats?: Stats;
  };
}>;

type TestPathCaseStats = Record<keyof (TestPathCases), number>;

export type TestPathCaseWithPathPatternStats = Record<
  keyof (TestPathCasesWithPathPattern),
  number
>;

export type Stats = TestPathCaseStats | TestPathCaseWithPathPatternStats;

export type TestPathCases = {
  roots: (path: Config.Path) => boolean;
  testMatch: (path: Config.Path) => boolean;
  testPathIgnorePatterns: (path: Config.Path) => boolean;
  testRegex: (path: Config.Path) => boolean;
};

export type TestPathCasesWithPathPattern = TestPathCases & {
  testPathPattern: (path: Config.Path) => boolean;
};

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
