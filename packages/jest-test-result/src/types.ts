/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {V8Coverage} from 'collect-v8-coverage';
import type {CoverageMap, CoverageMapData} from 'istanbul-lib-coverage';
import type {ConsoleBuffer} from '@jest/console';
import type {Circus, Config, TestResult, TransformTypes} from '@jest/types';
import type {IHasteFS, IModuleMap} from 'jest-haste-map';
import type Resolver from 'jest-resolve';

export interface RuntimeTransformResult extends TransformTypes.TransformResult {
  wrapperLength: number;
}

export type V8CoverageResult = Array<{
  codeTransformResult: RuntimeTransformResult | undefined;
  result: V8Coverage[number];
}>;

export type SerializableError = TestResult.SerializableError;

export interface FailedAssertion {
  matcherName?: string;
  message?: string;
  actual?: unknown;
  pass?: boolean;
  passed?: boolean;
  expected?: unknown;
  isNot?: boolean;
  stack?: string;
  error?: unknown;
}

export interface AssertionLocation {
  fullName: string;
  path: string;
}

export type Status = AssertionResult['status'];

export type AssertionResult = TestResult.AssertionResult;

export type FormattedAssertionResult = Pick<
  AssertionResult,
  'ancestorTitles' | 'fullName' | 'location' | 'status' | 'title' | 'duration'
> & {
  failureMessages: AssertionResult['failureMessages'] | null;
};

export interface AggregatedResultWithoutCoverage {
  numFailedTests: number;
  numFailedTestSuites: number;
  numPassedTests: number;
  numPassedTestSuites: number;
  numPendingTests: number;
  numTodoTests: number;
  numPendingTestSuites: number;
  numRuntimeErrorTestSuites: number;
  numTotalTests: number;
  numTotalTestSuites: number;
  openHandles: Array<Error>;
  snapshot: SnapshotSummary;
  startTime: number;
  success: boolean;
  testResults: Array<TestResult>;
  wasInterrupted: boolean;
  runExecError?: SerializableError;
}

export type AggregatedResult = AggregatedResultWithoutCoverage & {
  coverageMap?: CoverageMap | null;
};

export type TestResultsProcessor = (
  results: AggregatedResult,
) => AggregatedResult | Promise<AggregatedResult>;

export interface Suite {
  title: string;
  suites: Array<Suite>;
  tests: Array<AssertionResult>;
}

export type TestCaseResult = AssertionResult;

export interface TestResult {
  console?: ConsoleBuffer;
  coverage?: CoverageMapData;
  displayName?: Config.DisplayName;
  /**
   * Whether [`test.failing()`](https://jestjs.io/docs/api#testfailingname-fn-timeout)
   * was used.
   */
  failing?: boolean;
  failureMessage?: string | null;
  leaks: boolean;
  memoryUsage?: number;
  numFailingTests: number;
  numPassingTests: number;
  numPendingTests: number;
  numTodoTests: number;
  openHandles: Array<Error>;
  perfStats: {
    end: number;
    loadTestEnvironmentEnd: number;
    loadTestEnvironmentStart: number;
    runtime: number;
    setupAfterEnvEnd: number;
    setupAfterEnvStart: number;
    setupFilesEnd: number;
    setupFilesStart: number;
    slow: boolean;
    start: number;
  };
  skipped: boolean;
  snapshot: {
    added: number;
    fileDeleted: boolean;
    matched: number;
    unchecked: number;
    uncheckedKeys: Array<string>;
    unmatched: number;
    updated: number;
  };
  testExecError?: SerializableError;
  testFilePath: string;
  testResults: Array<AssertionResult>;
  v8Coverage?: V8CoverageResult;
}

export interface FormattedTestResult {
  message: string;
  name: string;
  summary: string;
  status: 'failed' | 'passed' | 'skipped' | 'focused';
  startTime: number;
  endTime: number;
  coverage: unknown;
  assertionResults: Array<FormattedAssertionResult>;
}

export interface FormattedTestResults {
  coverageMap?: CoverageMap | null | undefined;
  numFailedTests: number;
  numFailedTestSuites: number;
  numPassedTests: number;
  numPassedTestSuites: number;
  numPendingTests: number;
  numPendingTestSuites: number;
  numRuntimeErrorTestSuites: number;
  numTotalTests: number;
  numTotalTestSuites: number;
  snapshot: SnapshotSummary;
  startTime: number;
  success: boolean;
  testResults: Array<FormattedTestResult>;
  wasInterrupted: boolean;
}

export type CodeCoverageReporter = unknown;

export type CodeCoverageFormatter = (
  coverage: CoverageMapData | null | undefined,
  reporter: CodeCoverageReporter,
) => Record<string, unknown> | null | undefined;

export interface UncheckedSnapshot {
  filePath: string;
  keys: Array<string>;
}

export interface SnapshotSummary {
  added: number;
  didUpdate: boolean;
  failure: boolean;
  filesAdded: number;
  filesRemoved: number;
  filesRemovedList: Array<string>;
  filesUnmatched: number;
  filesUpdated: number;
  matched: number;
  total: number;
  unchecked: number;
  uncheckedKeysByFile: Array<UncheckedSnapshot>;
  unmatched: number;
  updated: number;
}

export interface Test {
  context: TestContext;
  duration?: number;
  path: string;
}

export interface TestContext {
  config: Config.ProjectConfig;
  hasteFS: IHasteFS;
  moduleMap: IModuleMap;
  resolver: Resolver;
}

// Typings for `sendMessageToJest` events
export interface TestEvents {
  'test-file-start': [Test];
  'test-file-success': [Test, TestResult];
  'test-file-failure': [Test, SerializableError];
  'test-case-start': [string, Circus.TestCaseStartInfo];
  'test-case-result': [string, AssertionResult];
}

export type TestFileEvent<T extends keyof TestEvents = keyof TestEvents> = (
  eventName: T,
  args: TestEvents[T],
) => unknown;
