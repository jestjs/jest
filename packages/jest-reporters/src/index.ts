/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import getResultHeader from './getResultHeader';
import getSnapshotStatus from './getSnapshotStatus';
import getSnapshotSummary from './getSnapshotSummary';
import {
  formatTestPath,
  getSummary,
  printDisplayName,
  relativePath,
  trimAndFormatPath,
} from './utils';

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
export {default as NotifyReporter} from './NotifyReporter';
export {default as SummaryReporter} from './SummaryReporter';
export {default as VerboseReporter} from './VerboseReporter';
export {default as GitHubActionsReporter} from './GitHubActionsReporter';
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
