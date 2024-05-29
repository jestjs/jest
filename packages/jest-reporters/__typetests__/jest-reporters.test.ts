/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect} from 'tstyche';
import {
  type AggregatedResult,
  type Config,
  type SnapshotSummary,
  type SummaryOptions,
  type TestResult,
  utils,
} from '@jest/reporters';

declare const aggregatedResults: AggregatedResult;
declare const globalConfig: Config.GlobalConfig;
declare const projectConfig: Config.ProjectConfig;
declare const snapshot: TestResult['snapshot'];
declare const snapshotSummary: SnapshotSummary;
declare const summaryOptions: SummaryOptions;
declare const testResult: TestResult;

// utils.formatTestPath()

expect(utils.formatTestPath(globalConfig, 'some/path')).type.toBeString();
expect(utils.formatTestPath(projectConfig, 'some/path')).type.toBeString();
expect(utils.formatTestPath()).type.toRaiseError();
expect(utils.formatTestPath({}, 'some/path')).type.toRaiseError();
expect(utils.formatTestPath(globalConfig, 123)).type.toRaiseError();
expect(utils.formatTestPath(projectConfig, 123)).type.toRaiseError();

// utils.getResultHeader()

expect(
  utils.getResultHeader(testResult, globalConfig, projectConfig),
).type.toBeString();
expect(utils.getResultHeader(testResult, globalConfig)).type.toBeString();
expect(utils.getResultHeader()).type.toRaiseError();
expect(utils.getResultHeader({}, globalConfig)).type.toRaiseError();
expect(
  utils.getResultHeader({}, globalConfig, projectConfig),
).type.toRaiseError();
expect(utils.getResultHeader(testResult, {})).type.toRaiseError();
expect(utils.getResultHeader(testResult, globalConfig, {})).type.toRaiseError();

// utils.getSnapshotStatus()

expect(utils.getSnapshotStatus(snapshot, true)).type.toBe<Array<string>>();
expect(utils.getSnapshotStatus()).type.toRaiseError();
expect(utils.getSnapshotStatus({}, true)).type.toRaiseError();
expect(utils.getSnapshotStatus(snapshot, 123)).type.toRaiseError();

// utils.getSnapshotSummary()

expect(
  utils.getSnapshotSummary(snapshotSummary, globalConfig, 'press `u`'),
).type.toBe<Array<string>>();
expect(utils.getSnapshotSummary()).type.toRaiseError();
expect(
  utils.getSnapshotSummary({}, globalConfig, 'press `u`'),
).type.toRaiseError();
expect(
  utils.getSnapshotSummary(snapshotSummary, {}, 'press `u`'),
).type.toRaiseError();
expect(
  utils.getSnapshotSummary(snapshotSummary, globalConfig, true),
).type.toRaiseError();

// utils.getSummary()

expect(utils.getSummary(aggregatedResults, summaryOptions)).type.toBeString();
expect(utils.getSummary(aggregatedResults)).type.toBeString();
expect(utils.getSummary()).type.toRaiseError();
expect(utils.getSummary({})).type.toRaiseError();
expect(utils.getSummary(aggregatedResults, true)).type.toRaiseError();

// utils.printDisplayName()

expect(utils.printDisplayName(projectConfig)).type.toBeString();
expect(utils.printDisplayName()).type.toRaiseError();
expect(utils.printDisplayName({})).type.toRaiseError();

// utils.relativePath()

expect(utils.relativePath(globalConfig, 'some/path')).type.toBe<{
  basename: string;
  dirname: string;
}>();
expect(utils.relativePath(projectConfig, 'some/path')).type.toBe<{
  basename: string;
  dirname: string;
}>();
expect(utils.relativePath()).type.toRaiseError();
expect(utils.relativePath({}, 'some/path')).type.toRaiseError();
expect(utils.relativePath(projectConfig, true)).type.toRaiseError();

// utils.trimAndFormatPath()

expect(
  utils.trimAndFormatPath(2, globalConfig, 'some/path', 4),
).type.toBeString();
expect(utils.trimAndFormatPath()).type.toRaiseError();
expect(
  utils.trimAndFormatPath(true, globalConfig, 'some/path', 4),
).type.toRaiseError();
expect(utils.trimAndFormatPath(2, {}, 'some/path', 4)).type.toRaiseError();
expect(utils.trimAndFormatPath(2, globalConfig, true, 4)).type.toRaiseError();
expect(
  utils.trimAndFormatPath(2, globalConfig, 'some/path', '4'),
).type.toRaiseError();
