/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AggregatedResult} from 'types/TestResult';
import type {ProjectConfig, Path} from 'types/Config';

type JestHookExposedFS = {
  projects: Array<{config: ProjectConfig, testPaths: Array<Path>}>,
};

type FsChange = (fs: JestHookExposedFS) => void;
type ShouldRunTestSuite = (testPath: string) => Promise<boolean>;
type TestRunComplete = (results: AggregatedResult) => void;

export type JestHookSubscriber = {
  fsChange: (fn: FsChange) => void,
  shouldRunTestSuite: (fn: ShouldRunTestSuite) => void,
  testRunComplete: (fn: TestRunComplete) => void,
};

export type JestHookEmitter = {
  fsChange: (fs: JestHookExposedFS) => void,
  shouldRunTestSuite: (testPath: string) => Promise<boolean>,
  testRunComplete: (results: AggregatedResult) => void,
};

class JestHooks {
  _listeners: {
    fsChange: Array<FsChange>,
    shouldRunTestSuite: Array<ShouldRunTestSuite>,
    testRunComplete: Array<TestRunComplete>,
  };

  constructor() {
    this._listeners = {
      fsChange: [],
      shouldRunTestSuite: [],
      testRunComplete: [],
    };
  }

  isUsed(hook: string) {
    return this._listeners[hook] && this._listeners[hook].length;
  }

  getSubscriber(): JestHookSubscriber {
    return {
      fsChange: fn => {
        this._listeners.fsChange.push(fn);
      },
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
      fsChange: fs =>
        this._listeners.fsChange.forEach(listener => listener(fs)),
      shouldRunTestSuite: async testPath =>
        Promise.all(
          this._listeners.shouldRunTestSuite.map(listener =>
            listener(testPath),
          ),
        ).then(result =>
          result.every(shouldRunTestSuite => shouldRunTestSuite),
        ),
      testRunComplete: results =>
        this._listeners.testRunComplete.forEach(listener => listener(results)),
    };
  }
}

export default JestHooks;
