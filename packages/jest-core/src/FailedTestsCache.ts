/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Test} from 'jest-runner';
import {Config} from '@jest/types';
import {TestResult} from '@jest/test-result';

type TestMap = {[key: string]: {[key: string]: boolean}};

export default class FailedTestsCache {
  private _enabledTestsMap?: TestMap;

  filterTests(tests: Array<Test>): Array<Test> {
    const enabledTestsMap = this._enabledTestsMap;

    if (!enabledTestsMap) {
      return tests;
    }
    return tests.filter(testResult => enabledTestsMap[testResult.path]);
  }

  setTestResults(testResults: Array<TestResult>) {
    this._enabledTestsMap = (testResults || [])
      .filter(testResult => testResult.numFailingTests)
      .reduce<TestMap>((suiteMap, testResult) => {
        suiteMap[testResult.testFilePath] = testResult.testResults
          .filter(test => test.status === 'failed')
          .reduce(
            (testMap, test) => {
              testMap[test.fullName] = true;
              return testMap;
            },
            {} as {[name: string]: true},
          );
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
