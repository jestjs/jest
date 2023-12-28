/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {JestEnvironment} from '@jest/environment';
import type {
  SerializableError,
  Test,
  TestEvents,
  TestFileEvent,
  TestResult,
} from '@jest/test-result';
import type {Config} from '@jest/types';
import type RuntimeType from 'jest-runtime';
import type {TestWatcher} from 'jest-watcher';

export type ErrorWithCode = Error & {code?: string};

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
  runtime: RuntimeType,
  testPath: string,
  sendMessageToJest?: TestFileEvent,
) => Promise<TestResult>;

export type TestRunnerOptions = {
  serial: boolean;
};

export type TestRunnerContext = {
  changedFiles?: Set<string>;
  sourcesRelatedToTestsInChangedFiles?: Set<string>;
};

type SerializeSet<T> = T extends Set<infer U> ? Array<U> : T;

export type TestRunnerSerializedContext = {
  [K in keyof TestRunnerContext]: SerializeSet<TestRunnerContext[K]>;
};

export type UnsubscribeFn = () => void;

export interface CallbackTestRunnerInterface {
  readonly isSerial?: boolean;
  readonly supportsEventEmitters?: boolean;

  runTests(
    tests: Array<Test>,
    watcher: TestWatcher,
    onStart: OnTestStart,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure,
    options: TestRunnerOptions,
  ): Promise<void>;
}

export interface EmittingTestRunnerInterface {
  readonly isSerial?: boolean;
  readonly supportsEventEmitters: true;

  runTests(
    tests: Array<Test>,
    watcher: TestWatcher,
    options: TestRunnerOptions,
  ): Promise<void>;

  on<Name extends keyof TestEvents>(
    eventName: Name,
    listener: (eventData: TestEvents[Name]) => void | Promise<void>,
  ): UnsubscribeFn;
}

abstract class BaseTestRunner {
  readonly isSerial?: boolean;
  abstract readonly supportsEventEmitters: boolean;

  constructor(
    protected readonly _globalConfig: Config.GlobalConfig,
    protected readonly _context: TestRunnerContext,
  ) {}
}

export abstract class CallbackTestRunner
  extends BaseTestRunner
  implements CallbackTestRunnerInterface
{
  readonly supportsEventEmitters = false;

  abstract runTests(
    tests: Array<Test>,
    watcher: TestWatcher,
    onStart: OnTestStart,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure,
    options: TestRunnerOptions,
  ): Promise<void>;
}

export abstract class EmittingTestRunner
  extends BaseTestRunner
  implements EmittingTestRunnerInterface
{
  readonly supportsEventEmitters = true;

  abstract runTests(
    tests: Array<Test>,
    watcher: TestWatcher,
    options: TestRunnerOptions,
  ): Promise<void>;

  abstract on<Name extends keyof TestEvents>(
    eventName: Name,
    listener: (eventData: TestEvents[Name]) => void | Promise<void>,
  ): UnsubscribeFn;
}

export type JestTestRunner = CallbackTestRunner | EmittingTestRunner;
