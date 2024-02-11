/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createEmptyTestResult} from '@jest/test-result';

export default class BaseTestRunner {
  constructor(globalConfig, context) {
    this._globalConfig = globalConfig;
    this._context = context || {};
  }

  async runTests(tests, watcher, onStart, onResult, onFailure) {
    return tests.reduce(
      (promise, test) =>
        promise
          .then(async () => {
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
          .catch(error => onFailure(test, error)),
      Promise.resolve(),
    );
  }
}
