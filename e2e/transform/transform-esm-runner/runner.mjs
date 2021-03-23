/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import throat from 'throat';
import {createEmptyTestResult} from '@jest/test-result';

export default class BaseTestRunner {
  constructor(globalConfig, context) {
    this._globalConfig = globalConfig;
    this._context = context || {};
  }

  async runTests(tests, watcher, onStart, onResult, onFailure) {
    const mutex = throat(1);
    return tests.reduce(
      (promise, test) =>
        mutex(() =>
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
            .catch(err => onFailure(test, err)),
        ),
      Promise.resolve(),
    );
  }
}
