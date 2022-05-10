/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {summary as actionsSummary} from '@actions/core';
import type {
  AggregatedResult,
  Test,
  TestCaseResult,
  TestContext,
  TestResult,
} from '@jest/test-result';
import GitHubActionsReporter from '../GitHubActionsReporter';

process.stderr.write = jest.fn();

jest.spyOn(Date, 'now').mockReturnValue(6000);

jest.mock('@actions/core', () => {
  const addRaw = jest.fn(() => summary);
  const addTable = jest.fn(() => summary);
  const write = jest.fn(() => summary);

  const summary = {
    addRaw,
    addTable,
    write,
  } as unknown as jest.Mocked<typeof actionsSummary>;

  return {summary};
});

afterEach(() => {
  jest.clearAllMocks();
});

const reporter = new GitHubActionsReporter();

const testMeta = {
  context: {config: {rootDir: '/user/project'}},
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

const retryErrorMessage =
  'Error: \x1B[2mexpect(\x1B[22m\x1B[31mreceived\x1B[39m\x1B[2m).\x1B[22mtoBeFalsy\x1B[2m()\x1B[22m\n' +
  '\n' +
  'Received: \x1B[31mtrue\x1B[39m\n' +
  '    at Object.toBeFalsy (/user/project/__tests__/example.test.js:19:20)\n' +
  '    at Promise.then.completed (/user/project/jest/packages/jest-circus/build/utils.js:333:28)\n' +
  '    at new Promise (<anonymous>)\n' +
  '    at callAsyncCircusFn (/user/project/jest/packages/jest-circus/build/utils.js:259:10)\n' +
  '    at _callCircusTest (/user/project/jest/packages/jest-circus/build/run.js:276:40)\n' +
  '    at _runTest (/user/project/jest/packages/jest-circus/build/run.js:208:3)\n' +
  '    at _runTestsForDescribeBlock (/user/project/jest/packages/jest-circus/build/run.js:96:9)\n' +
  '    at _runTestsForDescribeBlock (/user/project/jest/packages/jest-circus/build/run.js:90:9)\n' +
  '    at run (/user/project/jest/packages/jest-circus/build/run.js:31:3)\n' +
  '    at runAndTransformResultsToJestFormat (/user/project/jest/packages/jest-circus/build/legacy-code-todo-rewrite/jestAdapterInit.js:135:21)';

const testCaseResult = {
  ancestorTitles: [] as Array<string>,
  failureMessages: [expectationsErrorMessage],
  title: 'example test',
} as TestCaseResult;

const testContexts = new Set<TestContext>();

describe('logs error annotation', () => {
  test('when an expectation fails to pass', () => {
    reporter.onTestFileResult(testMeta, {
      testResults: [
        {
          ...testCaseResult,
          failureMessages: [expectationsErrorMessage],
        },
      ],
    } as TestResult);

    expect(jest.mocked(process.stderr.write)).toBeCalledTimes(1);
    expect(jest.mocked(process.stderr.write).mock.calls[0]).toMatchSnapshot();
  });

  test('when a test has reference error', () => {
    reporter.onTestFileResult(
      {...testMeta, path: '/user/project/__tests__/example.test.js:25:12'},
      {
        testResults: [
          {
            ...testCaseResult,
            failureMessages: [referenceErrorMessage],
          },
        ],
      } as TestResult,
    );

    expect(jest.mocked(process.stderr.write)).toBeCalledTimes(1);
    expect(jest.mocked(process.stderr.write).mock.calls[0]).toMatchSnapshot();
  });

  test('when test is wrapped in describe block', () => {
    reporter.onTestFileResult(testMeta, {
      testResults: [
        {
          ...testCaseResult,
          ancestorTitles: ['describe'],
        },
      ],
    } as TestResult);

    expect(jest.mocked(process.stderr.write)).toBeCalledTimes(1);
    expect(jest.mocked(process.stderr.write).mock.calls[0]).toMatchSnapshot();
  });
});

describe('logs warning annotation before logging errors', () => {
  test('when test result includes retry reasons', () => {
    reporter.onTestFileResult(testMeta, {
      testResults: [
        {
          ...testCaseResult,
          failureMessages: [retryErrorMessage],
          retryReasons: [retryErrorMessage],
        },
      ],
    } as TestResult);

    expect(jest.mocked(process.stderr.write)).toBeCalledTimes(2);
    expect(jest.mocked(process.stderr.write).mock.calls).toMatchSnapshot();
  });
});

describe("passes summary report to '@actions/core'", () => {
  test('when zero tests were ran', async () => {
    await reporter.onRunComplete(testContexts, {
      numTotalTests: 0,
    } as AggregatedResult);

    expect(actionsSummary.write).not.toBeCalled();
  });

  test('when just one test was ran', async () => {
    await reporter.onRunComplete(testContexts, {
      numPassedTests: 1,
      numTotalTestSuites: 0,
      numTotalTests: 1,
      snapshot: {total: 0},
      startTime: 4500,
    } as AggregatedResult);

    expect(jest.mocked(actionsSummary.addRaw).mock.calls).toMatchSnapshot();
    expect(jest.mocked(actionsSummary.addTable).mock.calls).toMatchSnapshot();
    expect(actionsSummary.write).toBeCalledTimes(1);
  });

  test('when more than one test was ran', async () => {
    await reporter.onRunComplete(testContexts, {
      numFailedTests: 32,
      numPassedTests: 436,
      numPendingTests: 54,
      numTodoTests: 7,
      numTotalTestSuites: 0,
      numTotalTests: 529,
      snapshot: {total: 0},
      startTime: 1200,
    } as AggregatedResult);

    expect(jest.mocked(actionsSummary.addRaw).mock.calls).toMatchSnapshot();
    expect(jest.mocked(actionsSummary.addTable).mock.calls).toMatchSnapshot();
    expect(actionsSummary.write).toBeCalledTimes(1);
  });

  test('when just one test suite was ran', async () => {
    await reporter.onRunComplete(testContexts, {
      numPassedTestSuites: 1,
      numPendingTests: 2,
      numTotalTestSuites: 1,
      numTotalTests: 12,
      snapshot: {total: 0},
      startTime: 4500,
    } as AggregatedResult);

    expect(jest.mocked(actionsSummary.addRaw).mock.calls).toMatchSnapshot();
    expect(jest.mocked(actionsSummary.addTable).mock.calls).toMatchSnapshot();
    expect(actionsSummary.write).toBeCalledTimes(1);
  });

  test('when more than one test suite was ran', async () => {
    await reporter.onRunComplete(testContexts, {
      numFailedTestSuites: 5,
      numPassedTestSuites: 24,
      numPendingTestSuites: 13,
      numTotalTestSuites: 42,
      numTotalTests: 522,
      snapshot: {total: 0},
      startTime: 1200,
    } as AggregatedResult);

    expect(jest.mocked(actionsSummary.addRaw).mock.calls).toMatchSnapshot();
    expect(jest.mocked(actionsSummary.addTable).mock.calls).toMatchSnapshot();
    expect(actionsSummary.write).toBeCalledTimes(1);
  });

  test('when just one snapshot was matched', async () => {
    await reporter.onRunComplete(testContexts, {
      numTotalTestSuites: 0,
      numTotalTests: 12,
      snapshot: {matched: 1, total: 1},
      startTime: 3800,
    } as AggregatedResult);

    expect(jest.mocked(actionsSummary.addRaw).mock.calls).toMatchSnapshot();
    expect(jest.mocked(actionsSummary.addTable).mock.calls).toMatchSnapshot();
    expect(actionsSummary.write).toBeCalledTimes(1);
  });

  test('when more than one snapshot was matched', async () => {
    await reporter.onRunComplete(testContexts, {
      numTotalTestSuites: 42,
      numTotalTests: 529,
      snapshot: {matched: 72, total: 85, unchecked: 1, unmatched: 12},
      startTime: 200,
    } as AggregatedResult);

    expect(jest.mocked(actionsSummary.addRaw).mock.calls).toMatchSnapshot();
    expect(jest.mocked(actionsSummary.addTable).mock.calls).toMatchSnapshot();
    expect(actionsSummary.write).toBeCalledTimes(1);
  });
});
