/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type {JestEnvironment} from '@jest/environment';
import {type TestResult, createEmptyTestResult} from '@jest/test-result';
import type {Config} from '@jest/types';
import type Runtime from 'jest-runtime';

export default async function testRunner(
  globalConfig: Config.GlobalConfig,
  config: Config.ProjectConfig,
  environment: JestEnvironment,
  runtime: Runtime,
  testPath: string,
): Promise<TestResult> {
  return {
    ...createEmptyTestResult(),
    numPassingTests: 1,
    testFilePath: testPath,
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
}
