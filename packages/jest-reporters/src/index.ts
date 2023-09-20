/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import formatTestPath from './formatTestPath';
import getResultHeader from './getResultHeader';
import getSnapshotStatus from './getSnapshotStatus';
import getSnapshotSummary from './getSnapshotSummary';
import getSummary from './getSummary';
import printDisplayName from './printDisplayName';
import relativePath from './relativePath';
import trimAndFormatPath from './trimAndFormatPath';

export type {
  AggregatedResult,
  SnapshotSummary,
  Test,
  TestCaseResult,
  TestContext,
  TestResult,
} from '@jest/test-result';
export type {Config} from '@jest/types';
export {default as BaseReporter} from './BaseReporter';
export {default as CoverageReporter} from './CoverageReporter';
export {default as DefaultReporter} from './DefaultReporter';
export {default as GitHubActionsReporter} from './GitHubActionsReporter';
export {default as NotifyReporter} from './NotifyReporter';
export {default as SummaryReporter} from './SummaryReporter';
export {default as VerboseReporter} from './VerboseReporter';
export type {SummaryReporterOptions} from './SummaryReporter';
export type {
  Reporter,
  ReporterOnStartOptions,
  ReporterContext,
  SummaryOptions,
} from './types';
export const utils = {
  formatTestPath,
  getResultHeader,
  getSnapshotStatus,
  getSnapshotSummary,
  getSummary,
  printDisplayName,
  relativePath,
  trimAndFormatPath,
};
