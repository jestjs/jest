/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectType} from 'tsd-lite';
import {
  CallbackTestRunner,
  CallbackTestRunnerInterface,
  Config,
  EmittingTestRunner,
  EmittingTestRunnerInterface,
  OnTestFailure,
  OnTestStart,
  OnTestSuccess,
  Test,
  TestEvents,
  TestRunnerContext,
  TestRunnerOptions,
  TestWatcher,
  UnsubscribeFn,
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
    expectType<Config.GlobalConfig>(this._globalConfig);
    expectType<TestRunnerContext>(this._context);

    return;
  }
}

const callbackRunner = new CallbackRunner(globalConfig, runnerContext);

expectType<boolean | undefined>(callbackRunner.isSerial);
expectType<false>(callbackRunner.supportsEventEmitters);

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
    expectType<Config.GlobalConfig>(this.#globalConfig);
    expectType<number>(this.#maxConcurrency);

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
    expectType<Config.GlobalConfig>(this._globalConfig);
    expectType<TestRunnerContext>(this._context);

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

expectType<boolean | undefined>(emittingRunner.isSerial);
expectType<true>(emittingRunner.supportsEventEmitters);

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
    expectType<Config.GlobalConfig>(this.#globalConfig);
    expectType<number>(this.#maxConcurrency);

    return;
  }

  on<Name extends keyof TestEvents>(
    eventName: string,
    listener: (eventData: TestEvents[Name]) => void | Promise<void>,
  ): UnsubscribeFn {
    return () => {};
  }
}
