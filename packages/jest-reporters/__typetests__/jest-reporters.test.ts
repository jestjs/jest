/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectError, expectType} from 'tsd-lite';
import {
  AggregatedResult,
  Config,
  SnapshotSummary,
  SummaryOptions,
  TestResult,
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

expectType<string>(utils.formatTestPath(globalConfig, 'some/path'));
expectType<string>(utils.formatTestPath(projectConfig, 'some/path'));
expectError(utils.formatTestPath());
expectError(utils.formatTestPath({}, 'some/path'));
expectError(utils.formatTestPath(globalConfig, 123));
expectError(utils.formatTestPath(projectConfig, 123));

// utils.getResultHeader()

expectType<string>(
  utils.getResultHeader(testResult, globalConfig, projectConfig),
);
expectType<string>(utils.getResultHeader(testResult, globalConfig));
expectError(utils.getResultHeader());
expectError(utils.getResultHeader({}, globalConfig));
expectError(utils.getResultHeader({}, globalConfig, projectConfig));
expectError(utils.getResultHeader(testResult, {}));
expectError(utils.getResultHeader(testResult, globalConfig, {}));

// utils.getSnapshotStatus()

expectType<Array<string>>(utils.getSnapshotStatus(snapshot, true));
expectError(utils.getSnapshotStatus());
expectError(utils.getSnapshotStatus({}, true));
expectError(utils.getSnapshotStatus(snapshot, 123));

// utils.getSnapshotSummary()

expectType<Array<string>>(
  utils.getSnapshotSummary(snapshotSummary, globalConfig, 'press `u`'),
);
expectError(utils.getSnapshotSummary());
expectError(utils.getSnapshotSummary({}, globalConfig, 'press `u`'));
expectError(utils.getSnapshotSummary(snapshotSummary, {}, 'press `u`'));
expectError(utils.getSnapshotSummary(snapshotSummary, globalConfig, true));

// utils.getSummary()

expectType<string>(utils.getSummary(aggregatedResults, summaryOptions));
expectType<string>(utils.getSummary(aggregatedResults));
expectError(utils.getSummary());
expectError(utils.getSummary({}));
expectError(utils.getSummary(aggregatedResults, true));

// utils.printDisplayName()

expectType<string>(utils.printDisplayName(projectConfig));
expectError(utils.printDisplayName());
expectError(utils.printDisplayName({}));

// utils.relativePath()

expectType<{basename: string; dirname: string}>(
  utils.relativePath(globalConfig, 'some/path'),
);
expectType<{basename: string; dirname: string}>(
  utils.relativePath(projectConfig, 'some/path'),
);
expectError(utils.relativePath());
expectError(utils.relativePath({}, 'some/path'));
expectError(utils.relativePath(projectConfig, true));

// utils.trimAndFormatPath()

expectType<string>(utils.trimAndFormatPath(2, globalConfig, 'some/path', 4));
expectError(utils.trimAndFormatPath());
expectError(utils.trimAndFormatPath(true, globalConfig, 'some/path', 4));
expectError(utils.trimAndFormatPath(2, {}, 'some/path', 4));
expectError(utils.trimAndFormatPath(2, globalConfig, true, 4));
expectError(utils.trimAndFormatPath(2, globalConfig, 'some/path', '4'));
