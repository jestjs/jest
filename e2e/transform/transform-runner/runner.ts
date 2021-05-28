/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import throat from 'throat';
import {Test, TestResult, createEmptyTestResult} from '@jest/test-result';
import type {Config} from '@jest/types';
import type {
  OnTestFailure,
  OnTestStart,
  OnTestSuccess,
  TestRunnerContext,
  TestWatcher,
} from 'jest-runner';

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
    onFailure: OnTestFailure,
  ): Promise<void> {
    const mutex = throat(1);
    return tests.reduce(
      (promise, test) =>
        mutex(() =>
          promise
            .then(async (): Promise<TestResult> => {
              await onStart(test);
              return {
                ...createEmptyTestResult(),
                numPassingTests: 1,
                testFilePath: test.path,
                testResults: [
                  {
                    ancestorTitles: [],
                    duration: 2,
                    failureDetails: [],
                    failureMessages: [],
                    fullName: 'sample test',
                    location: null,
                    numPassingAsserts: 1,
                    status: 'passed',
                    title: 'sample test',
                  },
                ],
              };
            })
            .then(result => onResult(test, result))
            .catch(err => onFailure(test, err)),
        ),
      Promise.resolve(),
    );
  }
}
