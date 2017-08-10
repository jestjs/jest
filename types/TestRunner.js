/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Context} from './Context';
import type {Environment} from 'types/Environment';
import type {GlobalConfig, Path, ProjectConfig} from './Config';
import type {ReporterOnStartOptions} from 'types/Reporters';
import type {
  AggregatedResult,
  SerializableError,
  TestResult,
} from 'types/TestResult';
import type Runtime from 'jest-runtime';
import type TestWatcher from 'jest-cli/src/test_watcher';

export type Test = {|
  context: Context,
  duration: ?number,
  path: Path,
|};

export type OnTestStart = Test => Promise<void>;
export type OnTestFailure = (Test, SerializableError) => Promise<*>;
export type OnTestSuccess = (Test, TestResult) => Promise<*>;

export type Reporter = {
  +onTestResult: (
    test: Test,
    testResult: TestResult,
    aggregatedResult: AggregatedResult,
  ) => ?Promise<void>,
  +onRunStart: (
    results: AggregatedResult,
    options: ReporterOnStartOptions,
  ) => ?Promise<void>,
  +onTestStart: (test: Test) => ?Promise<void>,
  +onRunComplete: (
    contexts: Set<Context>,
    results: AggregatedResult,
  ) => ?Promise<void>,
  +getLastError: () => ?Error,
};

export type TestFramework = (
  globalConfig: GlobalConfig,
  config: ProjectConfig,
  environment: Environment,
  runtime: Runtime,
  testPath: string,
) => Promise<TestResult>;

export type TestRunnerOptions = {
  serial: boolean,
};
