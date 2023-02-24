/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import testResult from '@jest/test-result';

const {createEmptyTestResult} = testResult;

export default async function testRunner(
  globalConfig,
  config,
  environment,
  runtime,
  testPath,
) {
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
