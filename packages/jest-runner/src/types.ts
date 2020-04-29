/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {EventEmitter} from 'events';
import type {Config} from '@jest/types';
import type {SerializableError, TestResult} from '@jest/test-result';
import type {JestEnvironment} from '@jest/environment';
import type {FS as HasteFS, ModuleMap} from 'jest-haste-map';
import HasteResolver = require('jest-resolve');
import Runtime = require('jest-runtime');

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

export type OnTestStart = (test: Test) => Promise<void>;
export type OnTestFailure = (
  test: Test,
  serializableError: SerializableError,
) => Promise<void>;
export type OnTestSuccess = (
  test: Test,
  testResult: TestResult,
) => Promise<void>;

export type TestFramework = (
  globalConfig: Config.GlobalConfig,
  config: Config.ProjectConfig,
  environment: JestEnvironment,
  runtime: Runtime,
  testPath: string,
) => Promise<TestResult>;

export type TestRunnerOptions = {
  serial: boolean;
};

// make sure all props here are present in the type below it as well
export type TestRunnerContext = {
  changedFiles?: Set<Config.Path>;
  sourcesRelatedToTestsInChangedFiles?: Set<Config.Path>;
};

export type TestRunnerSerializedContext = {
  changedFiles?: Array<Config.Path>;
  sourcesRelatedToTestsInChangedFiles?: Array<Config.Path>;
};

// TODO: Should live in `@jest/core` or `jest-watcher`
export type WatcherState = {
  interrupted: boolean;
};
export interface TestWatcher extends EventEmitter {
  state: WatcherState;
  setState(state: WatcherState): void;
  isInterrupted(): boolean;
  isWatchMode(): boolean;
}
