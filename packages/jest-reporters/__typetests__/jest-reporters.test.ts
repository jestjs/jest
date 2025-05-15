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

expect(utils.formatTestPath(globalConfig, 'some/path')).type.toBe<string>();
expect(utils.formatTestPath(projectConfig, 'some/path')).type.toBe<string>();
expect(utils.formatTestPath).type.not.toBeCallableWith();
expect(utils.formatTestPath).type.not.toBeCallableWith({}, 'some/path');
expect(utils.formatTestPath).type.not.toBeCallableWith(globalConfig, 123);
expect(utils.formatTestPath).type.not.toBeCallableWith(projectConfig, 123);

// utils.getResultHeader()

expect(
  utils.getResultHeader(testResult, globalConfig, projectConfig),
).type.toBe<string>();
expect(utils.getResultHeader(testResult, globalConfig)).type.toBe<string>();
expect(utils.getResultHeader).type.not.toBeCallableWith();
expect(utils.getResultHeader).type.not.toBeCallableWith({}, globalConfig);
expect(utils.getResultHeader).type.not.toBeCallableWith(
  {},
  globalConfig,
  projectConfig,
);
expect(utils.getResultHeader).type.not.toBeCallableWith(testResult, {});
expect(utils.getResultHeader).type.not.toBeCallableWith(
  testResult,
  globalConfig,
  {},
);

// utils.getSnapshotStatus()

expect(utils.getSnapshotStatus(snapshot, true)).type.toBe<Array<string>>();
expect(utils.getSnapshotStatus).type.not.toBeCallableWith();
expect(utils.getSnapshotStatus).type.not.toBeCallableWith({}, true);
expect(utils.getSnapshotStatus).type.not.toBeCallableWith(snapshot, 123);

// utils.getSnapshotSummary()

expect(
  utils.getSnapshotSummary(snapshotSummary, globalConfig, 'press `u`'),
).type.toBe<Array<string>>();
expect(utils.getSnapshotSummary).type.not.toBeCallableWith();
expect(utils.getSnapshotSummary).type.not.toBeCallableWith(
  {},
  globalConfig,
  'press `u`',
);
expect(utils.getSnapshotSummary).type.not.toBeCallableWith(
  snapshotSummary,
  {},
  'press `u`',
);
expect(utils.getSnapshotSummary).type.not.toBeCallableWith(
  snapshotSummary,
  globalConfig,
  true,
);

// utils.getSummary()

expect(utils.getSummary(aggregatedResults, summaryOptions)).type.toBe<string>();
expect(utils.getSummary(aggregatedResults)).type.toBe<string>();
expect(utils.getSummary).type.not.toBeCallableWith();
expect(utils.getSummary).type.not.toBeCallableWith({});
expect(utils.getSummary).type.not.toBeCallableWith(aggregatedResults, true);

// utils.printDisplayName()

expect(utils.printDisplayName(projectConfig)).type.toBe<string>();
expect(utils.printDisplayName).type.not.toBeCallableWith();
expect(utils.printDisplayName).type.not.toBeCallableWith({});

// utils.relativePath()

expect(utils.relativePath(globalConfig, 'some/path')).type.toBe<{
  basename: string;
  dirname: string;
}>();
expect(utils.relativePath(projectConfig, 'some/path')).type.toBe<{
  basename: string;
  dirname: string;
}>();
expect(utils.relativePath).type.not.toBeCallableWith();
expect(utils.relativePath).type.not.toBeCallableWith({}, 'some/path');
expect(utils.relativePath).type.not.toBeCallableWith(projectConfig, true);

// utils.trimAndFormatPath()

expect(
  utils.trimAndFormatPath(2, globalConfig, 'some/path', 4),
).type.toBe<string>();
expect(utils.trimAndFormatPath).type.not.toBeCallableWith();
expect(utils.trimAndFormatPath).type.not.toBeCallableWith(
  true,
  globalConfig,
  'some/path',
  4,
);
expect(utils.trimAndFormatPath).type.not.toBeCallableWith(
  2,
  {},
  'some/path',
  4,
);
expect(utils.trimAndFormatPath).type.not.toBeCallableWith(
  2,
  globalConfig,
  true,
  4,
);
expect(utils.trimAndFormatPath).type.not.toBeCallableWith(
  2,
  globalConfig,
  'some/path',
  '4',
);
