/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AggregatedResult} from 'types/TestResult';

type ShouldRunTestSuite = (testPath: string) => boolean;
type TestRunComplete = (results: AggregatedResult) => void;

export type JestHookSubscriber = {
  shouldRunTestSuite: (fn: ShouldRunTestSuite) => void,
  testRunComplete: (fn: TestRunComplete) => void,
};

export type JestHookEmitter = {
  shouldRunTestSuite: (testPath: string) => boolean,
  testRunComplete: (results: AggregatedResult) => void,
};

class JestHooks {
  _listeners: {
    shouldRunTestSuite: Array<ShouldRunTestSuite>,
    testRunComplete: Array<TestRunComplete>,
  };

  constructor() {
    this._listeners = {
      shouldRunTestSuite: [],
      testRunComplete: [],
    };
  }

  getSubscriber(): JestHookSubscriber {
    return {
      shouldRunTestSuite: fn => {
        this._listeners.shouldRunTestSuite.push(fn);
      },
      testRunComplete: fn => {
        this._listeners.testRunComplete.push(fn);
      },
    };
  }

  getEmitter(): JestHookEmitter {
    return {
      shouldRunTestSuite: testPath =>
        this._listeners.shouldRunTestSuite.every(listener =>
          listener(testPath),
        ),
      testRunComplete: results =>
        this._listeners.testRunComplete.forEach(listener => listener(results)),
    };
  }
}

export default JestHooks;
