/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Test, TestCaseResult} from '@jest/test-result';
import GitHubActionsReporter from '../GitHubActionsReporter';

jest.mock('path', () => ({
  relative: () => '__tests__/example.test.js',
}));

jest.spyOn(process.stderr, 'write').mockImplementation(jest.fn());

afterEach(() => {
  jest.clearAllMocks();
});

const reporter = new GitHubActionsReporter();

const testMeta = {
  context: {config: {rootDir: '/user/project'}},
  path: '/user/project/__tests__/example.test.js',
} as Test;

const expectationsErrorMessage =
  'Error: \x1B[2mexpect(\x1B[22m\x1B[31mreceived\x1B[39m\x1B[2m).\x1B[22mtoBe\x1B[2m(\x1B[22m\x1B[32mexpected\x1B[39m\x1B[2m) // Object.is equality\x1B[22m\n' +
  '\n' +
  'Expected: \x1B[32m1\x1B[39m\n' +
  'Received: \x1B[31m10\x1B[39m\n' +
  '    at Object.toBe (/user/project/__tests__/example.test.js:20:14)\n' +
  '    at Promise.then.completed (/user/project/jest/packages/jest-circus/build/utils.js:333:28)\n' +
  '    at new Promise (<anonymous>)\n' +
  '    at callAsyncCircusFn (/user/project/jest/packages/jest-circus/build/utils.js:259:10)\n' +
  '    at _callCircusTest (/user/project/jest/packages/jest-circus/build/run.js:276:40)\n' +
  '    at processTicksAndRejections (node:internal/process/task_queues:95:5)\n' +
  '    at _runTest (/user/project/jest/packages/jest-circus/build/run.js:208:3)\n' +
  '    at _runTestsForDescribeBlock (/user/project/jest/packages/jest-circus/build/run.js:96:9)\n' +
  '    at run (/user/project/jest/packages/jest-circus/build/run.js:31:3)\n' +
  '    at runAndTransformResultsToJestFormat (/user/project/jest/packages/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:135:21)';

const referenceErrorMessage =
  'ReferenceError: abc is not defined\n' +
  '    at Object.abc (/user/project/__tests__/example.test.js:25:12)\n' +
  '    at Promise.then.completed (/user/project/jest/packages/jest-circus/build/utils.js:333:28)\n' +
  '    at new Promise (<anonymous>)\n' +
  '    at callAsyncCircusFn (/user/project/jest/packages/jest-circus/build/utils.js:259:10)\n' +
  '    at _callCircusTest (/user/project/jest/packages/jest-circus/build/run.js:276:40)\n' +
  '    at processTicksAndRejections (node:internal/process/task_queues:95:5)\n' +
  '    at _runTest (/user/project/jest/packages/jest-circus/build/run.js:208:3)\n' +
  '    at _runTestsForDescribeBlock (/user/project/jest/packages/jest-circus/build/run.js:96:9)\n' +
  '    at _runTestsForDescribeBlock (/user/project/jest/packages/jest-circus/build/run.js:90:9)\n' +
  '    at run (/user/project/jest/packages/jest-circus/build/run.js:31:3)';

const testCaseResult = {
  ancestorTitles: [] as Array<string>,
  failureMessages: [expectationsErrorMessage],
  title: 'some test',
} as TestCaseResult;

describe("passes test case report to '@actions/core'", () => {
  test('when expect returns an error', () => {
    reporter.onTestCaseResult(testMeta, {
      ...testCaseResult,
      failureMessages: [expectationsErrorMessage],
    });

    expect(jest.mocked(process.stderr.write)).toBeCalledTimes(1);
    expect(jest.mocked(process.stderr.write).mock.calls[0]).toMatchSnapshot();
  });

  test('when a test has reference error', () => {
    reporter.onTestCaseResult(
      {...testMeta, path: '/user/project/__tests__/example.test.js:25:12'},
      {
        ...testCaseResult,
        failureMessages: [referenceErrorMessage],
      },
    );

    expect(jest.mocked(process.stderr.write)).toBeCalledTimes(1);
    expect(jest.mocked(process.stderr.write).mock.calls[0]).toMatchSnapshot();
  });

  test('when test is wrapped in describe block', () => {
    reporter.onTestCaseResult(testMeta, {
      ...testCaseResult,
      ancestorTitles: ['describe'],
    });

    expect(jest.mocked(process.stderr.write)).toBeCalledTimes(1);
    expect(jest.mocked(process.stderr.write).mock.calls[0]).toMatchSnapshot();
  });

  test('when test not is wrapped in describe block', () => {
    reporter.onTestCaseResult(testMeta, testCaseResult);

    expect(jest.mocked(process.stderr.write)).toBeCalledTimes(1);
    expect(jest.mocked(process.stderr.write).mock.calls[0]).toMatchSnapshot();
  });
});
