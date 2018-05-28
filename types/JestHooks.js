/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AggregatedResult} from './TestResult';
import type {Path, ProjectConfig} from './Config';

export type JestHookExposedFS = {
  projects: Array<{config: ProjectConfig, testPaths: Array<Path>}>,
};

export type FileChange = (fs: JestHookExposedFS) => void;
export type ShouldRunTestSuite = (testPath: string) => Promise<boolean>;
export type TestRunComplete = (results: AggregatedResult) => void;

export type JestHookSubscriber = {
  onFileChange: (fn: FileChange) => void,
  onTestRunComplete: (fn: TestRunComplete) => void,
  shouldRunTestSuite: (fn: ShouldRunTestSuite) => void,
};

export type JestHookEmitter = {
  onFileChange: (fs: JestHookExposedFS) => void,
  onTestRunComplete: (results: AggregatedResult) => void,
  shouldRunTestSuite: (testPath: string) => Promise<boolean>,
};
