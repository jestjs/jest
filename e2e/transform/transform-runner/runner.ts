/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Config} from '@jest/types';
import {
  OnTestFailure,
  OnTestStart,
  OnTestSuccess,
  Test,
  TestRunnerContext,
  TestWatcher,
} from 'jest-runner';
import throat from 'throat';
import {TestResult} from '@jest/test-result';

export default class BaseTestRunner {
  private _globalConfig: Config.GlobalConfig;
  private _context: TestRunnerContext;

  constructor(globalConfig: Config.GlobalConfig, context?: TestRunnerContext) {
    this._globalConfig = globalConfig;
    this._context = context || {};
  }

  async runTests(
    tests: Array<Test>,
    watcher: TestWatcher,
    onStart: OnTestStart,
    onResult: OnTestSuccess,
    onFailure: OnTestFailure
  ): Promise<void> {
    const mutex = throat(1);
    return tests.reduce(
      (promise, test) =>
        mutex(() =>
          promise
            .then(async () => {
              await onStart(test);
              return {
                numFailingTests: 0,
                numPassingTests: 1,
                numPendingTests: 0,
                numTodoTests: 0,
                perfStats: {
                  end: 0,
                  start: 0,
                },
                snapshot: {
                  added: 0,
                  fileDeleted: false,
                  matched: 0,
                  unchecked: 0,
                  unmatched: 0,
                  updated: 0,
                },
                testFilePath: test.path,
                testResults: [
                  {
                    ancestorTitles: [],
                    duration: 2,
                    failureMessages: [],
                    fullName: 'sample test',
                    status: 'passed',
                    title: 'sample test',
                  },
                ],
              } as TestResult;
            })
            .then(result => onResult(test, result))
            .catch(err => onFailure(test, err))
        ),
      Promise.resolve()
    );
  }
}
