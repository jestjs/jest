/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {ReadStream, WriteStream} from 'tty';
import type {AggregatedResult} from '@jest/test-result';
import type {Config} from '@jest/types';

type TestSuiteInfo = {
  config: Config.ProjectConfig;
  duration?: number;
  testPath: string;
};

export type JestHookExposedFS = {
  projects: Array<{
    config: Config.ProjectConfig;
    testPaths: Array<string>;
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
  shouldRunTestSuite: (
    testSuiteInfo: TestSuiteInfo,
  ) => Promise<boolean> | boolean;
};

export type UsageData = {
  key: string;
  prompt: string;
};

export type AllowedConfigOptions = Partial<
  Pick<
    Config.GlobalConfig,
    | 'bail'
    | 'changedSince'
    | 'collectCoverage'
    | 'collectCoverageFrom'
    | 'coverageDirectory'
    | 'coverageReporters'
    | 'findRelatedTests'
    | 'maxRelatedTestsDepth'
    | 'nonFlagArgs'
    | 'notify'
    | 'notifyMode'
    | 'onlyFailures'
    | 'reporters'
    | 'testNamePattern'
    | 'updateSnapshot'
    | 'verbose'
  > & {
    mode: 'watch' | 'watchAll';
    testPathPatterns: Array<string>;
  }
>;

export type UpdateConfigCallback = (config?: AllowedConfigOptions) => void;

export interface WatchPlugin {
  isInternal?: boolean;
  apply?: (hooks: JestHookSubscriber) => void;
  getUsageInfo?: (globalConfig: Config.GlobalConfig) => UsageData | null;
  onKey?: (value: string) => void;
  run?: (
    globalConfig: Config.GlobalConfig,
    updateConfigAndRun: UpdateConfigCallback,
  ) => Promise<void | boolean>;
}
export type WatchPluginClass = new (options: {
  config: Record<string, unknown>;
  stdin: ReadStream;
  stdout: WriteStream;
}) => WatchPlugin;

export type ScrollOptions = {
  offset: number;
  max: number;
};
