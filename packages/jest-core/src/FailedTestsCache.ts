/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Test} from 'jest-runner';
import type {Config} from '@jest/types';
import type {TestResult} from '@jest/test-result';

type TestMap = Record<string, Record<string, boolean>>;

export default class FailedTestsCache {
  private _enabledTestsMap?: TestMap;

  filterTests(tests: Array<Test>): Array<Test> {
    const enabledTestsMap = this._enabledTestsMap;

    if (!enabledTestsMap) {
      return tests;
    }
    return tests.filter(testResult => enabledTestsMap[testResult.path]);
  }

  setTestResults(testResults: Array<TestResult>): void {
    this._enabledTestsMap = (testResults || [])
      .filter(testResult => testResult.numFailingTests)
      .reduce<TestMap>((suiteMap, testResult) => {
        suiteMap[testResult.testFilePath] = testResult.testResults
          .filter(test => test.status === 'failed')
          .reduce<{[name: string]: true}>((testMap, test) => {
            testMap[test.fullName] = true;
            return testMap;
          }, {});
        return suiteMap;
      }, {});

    this._enabledTestsMap = Object.freeze(this._enabledTestsMap);
  }

  updateConfig(globalConfig: Config.GlobalConfig): Config.GlobalConfig {
    if (!this._enabledTestsMap) {
      return globalConfig;
    }
    const newConfig: Config.GlobalConfig = {...globalConfig};
    newConfig.enabledTestsMap = this._enabledTestsMap;
    return Object.freeze(newConfig);
  }
}
