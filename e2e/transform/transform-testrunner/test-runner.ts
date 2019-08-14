/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {Config} from '@jest/types';
import {JestEnvironment} from '@jest/environment';
import Runtime from 'jest-runtime';
import {TestResult, createEmptyTestResult} from '@jest/test-result';

export default async function testRunner(
  globalConfig: Config.GlobalConfig,
  config: Config.ProjectConfig,
  environment: JestEnvironment,
  runtime: Runtime,
  testPath: string
): Promise<TestResult> {
  return {
    ...createEmptyTestResult(),
    numPassingTests: 1,
    testFilePath: testPath,
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
}
