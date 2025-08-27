/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import FailedTestsCache from '../FailedTestsCache';

describe('FailedTestsCache', () => {
  test('should filter tests', () => {
    const failedTestsCache = new FailedTestsCache();
    failedTestsCache.setTestResults([
      {
        numFailingTests: 0,
        testFilePath: '/path/to/passing.js',
        testResults: [
          {fullName: 'test 1', status: 'passed'},
          {fullName: 'test 2', status: 'passed'},
        ],
      },
      {
        numFailingTests: 2,
        testFilePath: '/path/to/failed_1.js',
        testResults: [
          {fullName: 'test 3', status: 'failed'},
          {fullName: 'test 4', status: 'failed'},
        ],
      },
      {
        numFailingTests: 1,
        testFilePath: '/path/to/failed_2.js',
        testResults: [
          {fullName: 'test 5', status: 'failed'},
          {fullName: 'test 6', status: 'passed'},
        ],
      },
      {
        numFailingTests: 0,
        testExecError: new Error('Cannot find module'),
        testFilePath: '/path/to/failed_exec.js',
        testResults: [],
      },
    ]);

    const result = failedTestsCache.filterTests([
      {
        path: '/path/to/passing.js',
      },
      {
        path: '/path/to/failed_1.js',
      },
      {
        path: '/path/to/failed_2.js',
      },
      {
        path: '/path/to/failed_exec.js',
      },
      {
        path: '/path/to/unknown.js',
      },
    ]);
    expect(result).toMatchObject([
      {
        path: '/path/to/failed_1.js',
      },
      {
        path: '/path/to/failed_2.js',
      },
      {
        path: '/path/to/failed_exec.js',
      },
    ]);
  });
});
