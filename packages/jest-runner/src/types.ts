/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from 'events';
import {Environment, Config, TestResult} from '@jest/types';
import {ModuleMap, FS as HasteFS} from 'jest-haste-map';
import HasteResolver from 'jest-resolve';
// @ts-ignore: not migrated to TS
import Runtime from 'jest-runtime';

export type ErrorWithCode = Error & {code?: string};
export type Test = {
  context: Context;
  duration?: number;
  path: Config.Path;
};

export type Context = {
  config: Config.ProjectConfig;
  hasteFS: HasteFS;
  moduleMap: ModuleMap;
  resolver: HasteResolver;
};

// TODO: Obtain this from @jest/reporters once its been migrated
type ReporterOnStartOptions = {
  estimatedTime: number;
  showStatus: boolean;
};

export type OnTestStart = (test: Test) => Promise<void>;
export type OnTestFailure = (
  test: Test,
  serializableError: TestResult.SerializableError,
) => Promise<void>;
export type OnTestSuccess = (
  test: Test,
  testResult: TestResult.TestResult,
) => Promise<void>;

export type Reporter = {
  onTestResult: (
    test: Test,
    testResult: TestResult.TestResult,
    aggregatedResult: TestResult.AggregatedResult,
  ) => Promise<void>;
  onRunStart: (
    results: TestResult.AggregatedResult,
    options: ReporterOnStartOptions,
  ) => Promise<void>;
  onTestStart: (test: Test) => Promise<void>;
  onRunComplete: (
    contexts: Set<Context>,
    results: TestResult.AggregatedResult,
  ) => Promise<void>;
  getLastError: () => Error;
};

export type TestFramework = (
  globalConfig: Config.GlobalConfig,
  config: Config.ProjectConfig,
  environment: Environment.Environment,
  runtime: Runtime,
  testPath: string,
) => Promise<TestResult.TestResult>;

export type TestRunnerOptions = {
  serial: boolean;
};

export type TestRunnerContext = {
  changedFiles?: Set<Config.Path>;
};

export type TestRunData = Array<{
  context: Context;
  matches: {allTests: number; tests: Array<Test>; total: number};
}>;

// TODO: Should live in `@jest/core` or `jest-watcher`
export type WatcherState = {
  interrupted: boolean;
};
export interface TestWatcher extends EventEmitter {
  state: WatcherState;
  new ({isWatchMode}: {isWatchMode: boolean}): TestWatcher;
  setState(state: WatcherState): void;
  isInterrupted(): boolean;
  isWatchMode(): boolean;
}
