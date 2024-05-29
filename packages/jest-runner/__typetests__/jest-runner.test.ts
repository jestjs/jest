/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect} from 'tstyche';
import {
  CallbackTestRunner,
  type CallbackTestRunnerInterface,
  type Config,
  EmittingTestRunner,
  type EmittingTestRunnerInterface,
  type OnTestFailure,
  type OnTestStart,
  type OnTestSuccess,
  type Test,
  type TestEvents,
  type TestRunnerContext,
  type TestRunnerOptions,
  type TestWatcher,
  type UnsubscribeFn,
} from 'jest-runner';

const globalConfig = {} as Config.GlobalConfig;
const runnerContext = {} as TestRunnerContext;

// CallbackRunner

class CallbackRunner extends CallbackTestRunner {
  async runTests(
    tests: Array<Test>,
    watcher: TestWatcher,
    onStart: OnTestStart,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure,
    options: TestRunnerOptions,
  ): Promise<void> {
    expect(this._globalConfig).type.toBe<Config.GlobalConfig>();
    expect(this._context).type.toBe<TestRunnerContext>();

    return;
  }
}

const callbackRunner = new CallbackRunner(globalConfig, runnerContext);

expect(callbackRunner.isSerial).type.toBe<boolean | undefined>();
expect(callbackRunner.supportsEventEmitters).type.toBe<false>();

// CallbackTestRunnerInterface

class CustomCallbackRunner implements CallbackTestRunnerInterface {
  readonly #maxConcurrency: number;
  readonly #globalConfig: Config.GlobalConfig;

  constructor(globalConfig: Config.GlobalConfig) {
    this.#globalConfig = globalConfig;
    this.#maxConcurrency = globalConfig.maxWorkers;
  }

  async runTests(
    tests: Array<Test>,
    watcher: TestWatcher,
    onStart: OnTestStart,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure,
    options: TestRunnerOptions,
  ): Promise<void> {
    expect(this.#globalConfig).type.toBe<Config.GlobalConfig>();
    expect(this.#maxConcurrency).type.toBeNumber();

    return;
  }
}

// EmittingRunner

class EmittingRunner extends EmittingTestRunner {
  async runTests(
    tests: Array<Test>,
    watcher: TestWatcher,
    options: TestRunnerOptions,
  ): Promise<void> {
    expect(this._globalConfig).type.toBe<Config.GlobalConfig>();
    expect(this._context).type.toBe<TestRunnerContext>();

    return;
  }

  on<Name extends keyof TestEvents>(
    eventName: string,
    listener: (eventData: TestEvents[Name]) => void | Promise<void>,
  ): UnsubscribeFn {
    return () => {};
  }
}

const emittingRunner = new EmittingRunner(globalConfig, runnerContext);

expect(emittingRunner.isSerial).type.toBe<boolean | undefined>();
expect(emittingRunner.supportsEventEmitters).type.toBe<true>();

// EmittingTestRunnerInterface

class CustomEmittingRunner implements EmittingTestRunnerInterface {
  readonly #maxConcurrency: number;
  readonly #globalConfig: Config.GlobalConfig;
  readonly supportsEventEmitters = true;

  constructor(globalConfig: Config.GlobalConfig) {
    this.#globalConfig = globalConfig;
    this.#maxConcurrency = globalConfig.maxWorkers;
  }

  async runTests(
    tests: Array<Test>,
    watcher: TestWatcher,
    options: TestRunnerOptions,
  ): Promise<void> {
    expect(this.#globalConfig).type.toBe<Config.GlobalConfig>();
    expect(this.#maxConcurrency).type.toBeNumber();

    return;
  }

  on<Name extends keyof TestEvents>(
    eventName: string,
    listener: (eventData: TestEvents[Name]) => void | Promise<void>,
  ): UnsubscribeFn {
    return () => {};
  }
}
