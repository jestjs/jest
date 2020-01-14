/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {GlobalConfig, Path, ProjectConfig} from '@jest/config-utils';
import {AggregatedResult} from '@jest/test-result';

type TestSuiteInfo = {
  config: ProjectConfig;
  duration?: number;
  testPath: string;
};

export type JestHookExposedFS = {
  projects: Array<{
    config: ProjectConfig;
    testPaths: Array<Path>;
  }>;
};

export type FileChange = (fs: JestHookExposedFS) => void;
export type ShouldRunTestSuite = (
  testSuiteInfo: TestSuiteInfo,
) => Promise<boolean>;
export type TestRunComplete = (results: AggregatedResult) => void;

export type JestHookSubscriber = {
  onFileChange: (fn: FileChange) => void;
  onTestRunComplete: (fn: TestRunComplete) => void;
  shouldRunTestSuite: (fn: ShouldRunTestSuite) => void;
};

export type JestHookEmitter = {
  onFileChange: (fs: JestHookExposedFS) => void;
  onTestRunComplete: (results: AggregatedResult) => void;
  shouldRunTestSuite: (testSuiteInfo: TestSuiteInfo) => Promise<boolean>;
};

export type UsageData = {
  key: string;
  prompt: string;
};

export type AllowedConfigOptions = Partial<
  Pick<
    GlobalConfig,
    | 'bail'
    | 'changedSince'
    | 'collectCoverage'
    | 'collectCoverageFrom'
    | 'collectCoverageOnlyFrom'
    | 'coverageDirectory'
    | 'coverageReporters'
    | 'notify'
    | 'notifyMode'
    | 'onlyFailures'
    | 'reporters'
    | 'testNamePattern'
    | 'testPathPattern'
    | 'updateSnapshot'
    | 'verbose'
  > & {mode: 'watch' | 'watchAll'}
>;

export type UpdateConfigCallback = (config?: AllowedConfigOptions) => void;

export interface WatchPlugin {
  isInternal?: boolean;
  apply?: (hooks: JestHookSubscriber) => void;
  getUsageInfo?: (globalConfig: GlobalConfig) => UsageData | null;
  onKey?: (value: string) => void;
  run?: (
    globalConfig: GlobalConfig,
    updateConfigAndRun: UpdateConfigCallback,
  ) => Promise<void | boolean>;
}
export interface WatchPluginClass {
  new (options: {
    stdin: NodeJS.ReadStream;
    stdout: NodeJS.WriteStream;
  }): WatchPlugin;
}

export type ScrollOptions = {
  offset: number;
  max: number;
};
