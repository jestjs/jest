/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {SerializableError, Test, TestResult} from '@jest/test-result';
import type {Config} from '@jest/types';
import type {TestWatcher} from 'jest-watcher';
import {runBrowserTest} from './runBrowserTest';

type OnTestStart = (test: Test) => Promise<void>;

type OnTestFailure = (
  test: Test,
  serializableError: SerializableError,
) => Promise<void>;

type OnTestSuccess = (test: Test, result: TestResult) => Promise<void>;

interface TestRunnerOptions {
  serial: boolean;
}

export default class BrowserTestRunner {
  readonly isSerial = false;
  readonly supportsEventEmitters = false;

  private readonly _globalConfig: Config.GlobalConfig;

  constructor(globalConfig: Config.GlobalConfig) {
    this._globalConfig = globalConfig;
  }

  async runTests(
    tests: Array<Test>,
    _watcher: TestWatcher,
    onStart: OnTestStart,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure,
    _options: TestRunnerOptions,
  ): Promise<void> {
    const firstConfig = tests[0]?.context?.config;
    const browserConfig = firstConfig?.browserMode;
    const isParallel =
      browserConfig?.fileParallelism !== false &&
      browserConfig?.headless !== false;

    if (isParallel && tests.length > 1) {
      const concurrency = this._globalConfig.maxWorkers || 3;
      const queue = [...tests];
      const workers: Array<Promise<void>> = [];

      for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
        workers.push(this._processQueue(queue, onStart, onResult, onFailure));
      }
      await Promise.all(workers);
    } else {
      for (const test of tests) {
        await this._runSingleTest(test, onStart, onResult, onFailure);
      }
    }
  }

  private async _processQueue(
    queue: Array<Test>,
    onStart: OnTestStart,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure,
  ): Promise<void> {
    while (queue.length > 0) {
      const test = queue.shift()!;
      await this._runSingleTest(test, onStart, onResult, onFailure);
    }
  }

  private async _runSingleTest(
    test: Test,
    onStart: OnTestStart,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure,
  ): Promise<void> {
    await onStart(test);
    try {
      const result = await runBrowserTest(test, this._globalConfig);
      await onResult(test, result);
    } catch (error) {
      const typedError = error as Error;
      await onFailure(test, {
        message: typedError.message,
        stack: typedError.stack,
        type: typedError.name || 'Error',
      } satisfies SerializableError);
    }
  }
}
