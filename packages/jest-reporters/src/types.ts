/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  AggregatedResult,
  Test,
  TestCaseResult,
  TestContext,
  TestResult,
} from '@jest/test-result';
import type {Config} from '@jest/types';

export type ReporterOnStartOptions = {
  estimatedTime: number;
  showStatus: boolean;
};

export interface Reporter {
  readonly onTestResult?: (
    test: Test,
    testResult: TestResult,
    aggregatedResult: AggregatedResult,
  ) => Promise<void> | void;
  readonly onTestFileResult?: (
    test: Test,
    testResult: TestResult,
    aggregatedResult: AggregatedResult,
  ) => Promise<void> | void;
  readonly onTestCaseResult?: (
    test: Test,
    testCaseResult: TestCaseResult,
  ) => Promise<void> | void;
  readonly onRunStart: (
    results: AggregatedResult,
    options: ReporterOnStartOptions,
  ) => Promise<void> | void;
  readonly onTestStart?: (test: Test) => Promise<void> | void;
  readonly onTestFileStart?: (test: Test) => Promise<void> | void;
  readonly onRunComplete: (
    testContexts: Set<TestContext>,
    results: AggregatedResult,
  ) => Promise<void> | void;
  readonly getLastError: () => Error | void;
}

export type ReporterContext = {
  firstRun: boolean;
  previousSuccess: boolean;
  changedFiles?: Set<string>;
  sourcesRelatedToTestsInChangedFiles?: Set<string>;
  startRun?: (globalConfig: Config.GlobalConfig) => unknown;
};

export type SummaryOptions = {
  currentTestCases?: Array<{test: Test; testCaseResult: TestCaseResult}>;
  estimatedTime?: number;
  roundTime?: boolean;
  width?: number;
};
