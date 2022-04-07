/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {UnsubscribeFn} from 'emittery';
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
  TestWatcher,
} from 'jest-runner';

const globalConfig = {} as Config.GlobalConfig;
const runnerContext = {} as TestRunnerContext;

class CallbackRunner extends CallbackTestRunner {
  override async runTests(
    tests: Array<Test>,
    watcher: TestWatcher,
    onStart: OnTestStart,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure,
    options: TestRunnerOptions,
  ): Promise<void> {
    return;
  }
}

const callbackRunner = new CallbackRunner(globalConfig, runnerContext);

expectType<boolean | undefined>(callbackRunner.isSerial);
expectType<false>(callbackRunner.supportsEventEmitters);

class EmittingRunner extends EmittingTestRunner {
  override on<Name extends keyof TestEvents>(
    eventName: string,
    listener: (eventData: TestEvents[Name]) => void | Promise<void>,
  ): UnsubscribeFn {
    return () => {};
  }

  override async runTests(
    tests: Array<Test>,
    watcher: TestWatcher,
    options: TestRunnerOptions,
  ): Promise<void> {
    return;
  }
}

const emittingRunner = new EmittingRunner(globalConfig, runnerContext);

expectType<boolean | undefined>(emittingRunner.isSerial);
expectType<true>(emittingRunner.supportsEventEmitters);
