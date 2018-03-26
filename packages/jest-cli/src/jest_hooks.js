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

type FileChange = (fs: JestHookExposedFS) => void;
type ShouldRunTestSuite = (testPath: string) => Promise<boolean>;
type TestRunComplete = (results: AggregatedResult) => void;

export type JestHookSubscriber = {
  fileChange: (fn: FileChange) => void,
  shouldRunTestSuite: (fn: ShouldRunTestSuite) => void,
  testRunComplete: (fn: TestRunComplete) => void,
};

export type JestHookEmitter = {
  fileChange: (fs: JestHookExposedFS) => void,
  shouldRunTestSuite: (testPath: string) => Promise<boolean>,
  testRunComplete: (results: AggregatedResult) => void,
};

class JestHooks {
  _listeners: {
    fileChange: Array<FileChange>,
    shouldRunTestSuite: Array<ShouldRunTestSuite>,
    testRunComplete: Array<TestRunComplete>,
  };

  constructor() {
    this._listeners = {
      fileChange: [],
      shouldRunTestSuite: [],
      testRunComplete: [],
    };
  }

  isUsed(hook: string) {
    return this._listeners[hook] && this._listeners[hook].length;
  }

  getSubscriber(): JestHookSubscriber {
    return {
      fileChange: fn => {
        this._listeners.fileChange.push(fn);
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
      fileChange: fs =>
        this._listeners.fileChange.forEach(listener => listener(fs)),
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
