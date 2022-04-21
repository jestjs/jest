/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectType} from 'tsd-lite';
import type {Test, TestEvents} from '@jest/test-result';
import type {Config} from '@jest/types';
import {CallbackTestRunner, EmittingTestRunner} from 'jest-runner';
import type {
  OnTestFailure,
  OnTestStart,
  OnTestSuccess,
  TestRunnerContext,
  TestRunnerOptions,
  UnsubscribeFn,
} from 'jest-runner';
import type {TestWatcher} from 'jest-watcher';

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
