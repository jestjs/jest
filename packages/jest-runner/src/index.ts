/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Config} from '@jest/types';
import {SerializableError} from '@jest/test-result';
import exit from 'exit';
import throat from 'throat';
import Worker from 'jest-worker';
import runTest from './runTest';
import {worker} from './testWorker';
import {
  OnTestFailure,
  OnTestStart,
  OnTestSuccess,
  Test as JestTest,
  TestRunnerContext,
  TestRunnerOptions,
  TestWatcher,
  WatcherState,
} from './types';

const TEST_WORKER_PATH = require.resolve('./testWorker');

interface WorkerInterface extends Worker {
  worker: typeof worker;
}

namespace TestRunner {
  export type Test = JestTest;
}

/* eslint-disable-next-line no-redeclare */
class TestRunner {
  private _globalConfig: Config.GlobalConfig;
  private _context: TestRunnerContext;

  constructor(globalConfig: Config.GlobalConfig, context?: TestRunnerContext) {
    this._globalConfig = globalConfig;
    this._context = context || {};
  }

  async runTests(
    tests: Array<JestTest>,
    watcher: TestWatcher,
    onStart: OnTestStart,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure,
    options: TestRunnerOptions,
  ): Promise<void> {
    return await (options.serial
      ? this._createInBandTestRun(tests, watcher, onStart, onResult, onFailure)
      : this._createParallelTestRun(
          tests,
          watcher,
          onStart,
          onResult,
          onFailure,
        ));
  }

  private async _createInBandTestRun(
    tests: Array<JestTest>,
    watcher: TestWatcher,
    onStart: OnTestStart,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure,
  ) {
    process.env.JEST_WORKER_ID = '1';
    const mutex = throat(1);
    return tests.reduce(
      (promise, test) =>
        mutex(() =>
          promise
            .then(async () => {
              if (watcher.isInterrupted()) {
                throw new CancelRun();
              }

              await onStart(test);
              return runTest(
                test.path,
                this._globalConfig,
                test.context.config,
                test.context.resolver,
                this._context,
              );
            })
            .then(result => onResult(test, result))
            .catch(err => onFailure(test, err)),
        ),
      Promise.resolve(),
    );
  }

  private async _createParallelTestRun(
    tests: Array<JestTest>,
    watcher: TestWatcher,
    onStart: OnTestStart,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure,
  ) {
    const worker = new Worker(TEST_WORKER_PATH, {
      exposedMethods: ['worker'],
      forkOptions: {stdio: 'pipe'},
      maxRetries: 3,
      numWorkers: this._globalConfig.maxWorkers,
    }) as WorkerInterface;

    if (worker.getStdout()) worker.getStdout().pipe(process.stdout);
    if (worker.getStderr()) worker.getStderr().pipe(process.stderr);

    const mutex = throat(this._globalConfig.maxWorkers);

    // Send test suites to workers continuously instead of all at once to track
    // the start time of individual tests.
    const runTestInWorker = (test: JestTest) =>
      mutex(async () => {
        if (watcher.isInterrupted()) {
          return Promise.reject();
        }

        await onStart(test);

        return worker.worker({
          config: test.context.config,
          context: this._context,
          globalConfig: this._globalConfig,
          path: test.path,
          serializableModuleMap: watcher.isWatchMode()
            ? test.context.moduleMap.toJSON()
            : null,
        });
      });

    const onError = async (err: SerializableError, test: JestTest) => {
      await onFailure(test, err);
      if (err.type === 'ProcessTerminatedError') {
        console.error(
          'A worker process has quit unexpectedly! ' +
            'Most likely this is an initialization error.',
        );
        exit(1);
      }
    };

    const onInterrupt = new Promise((_, reject) => {
      watcher.on('change', (state: WatcherState) => {
        if (state.interrupted) {
          reject(new CancelRun());
        }
      });
    });

    const runAllTests = Promise.all(
      tests.map(test =>
        runTestInWorker(test)
          .then(testResult => onResult(test, testResult))
          .catch(error => onError(error, test)),
      ),
    );

    const cleanup = () => worker.end();
    return Promise.race([runAllTests, onInterrupt]).then(cleanup, cleanup);
  }
}

class CancelRun extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'CancelRun';
  }
}

export = TestRunner;
