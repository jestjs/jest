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
type AvailableHooks =
  | 'onFileChange'
  | 'onTestRunComplete'
  | 'shouldRunTestSuite';

export type JestHookSubscriber = {
  onFileChange: (fn: FileChange) => void,
  onTestRunComplete: (fn: TestRunComplete) => void,
  shouldRunTestSuite: (fn: ShouldRunTestSuite) => void,
};

export type JestHookEmitter = {
  onFileChange: (fs: JestHookExposedFS) => void,
  onTestRunComplete: (results: AggregatedResult) => void,
  shouldRunTestSuite: (testPath: string) => Promise<boolean>,
};

class JestHooks {
  _listeners: {
    onFileChange: Array<FileChange>,
    onTestRunComplete: Array<TestRunComplete>,
    shouldRunTestSuite: Array<ShouldRunTestSuite>,
  };

  constructor() {
    this._listeners = {
      onFileChange: [],
      onTestRunComplete: [],
      shouldRunTestSuite: [],
    };
  }

  isUsed(hook: AvailableHooks) {
    return this._listeners[hook] && this._listeners[hook].length;
  }

  getSubscriber(): JestHookSubscriber {
    return {
      onFileChange: fn => {
        this._listeners.onFileChange.push(fn);
      },
      onTestRunComplete: fn => {
        this._listeners.onTestRunComplete.push(fn);
      },
      shouldRunTestSuite: fn => {
        this._listeners.shouldRunTestSuite.push(fn);
      },
    };
  }

  getEmitter(): JestHookEmitter {
    return {
      onFileChange: fs =>
        this._listeners.onFileChange.forEach(listener => listener(fs)),
      onTestRunComplete: results =>
        this._listeners.onTestRunComplete.forEach(listener =>
          listener(results),
        ),
      shouldRunTestSuite: async testPath =>
        Promise.all(
          this._listeners.shouldRunTestSuite.map(listener =>
            listener(testPath),
          ),
        ).then(result =>
          result.every(shouldRunTestSuite => shouldRunTestSuite),
        ),
    };
  }
}

export default JestHooks;
