/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  AggregatedResult,
  AssertionResult,
  Status,
  Test,
  TestCaseResult,
  TestResult,
} from '@jest/test-result';
import {makeGlobalConfig, normalizeIcons} from '@jest/test-utils';
import BaseGitHubActionsReporter from '../GitHubActionsReporter';

afterEach(() => {
  jest.clearAllMocks();
});

class GitHubActionsReporter extends BaseGitHubActionsReporter {
  override log(message: string): void {
    super.log(normalizeIcons(message));
  }
}

const mockedStderrWrite = jest
  .spyOn(process.stderr, 'write')
  .mockImplementation(() => true);

describe('annotations', () => {
  const reporter = new GitHubActionsReporter(makeGlobalConfig());

  const testMeta = {
    context: {config: {rootDir: '/user/project'}},
  } as Test;

  const expectationsErrorMessage =
    'Error: \u001B[2mexpect(\u001B[22m\u001B[31mreceived\u001B[39m\u001B[2m).\u001B[22mtoBe\u001B[2m(\u001B[22m\u001B[32mexpected\u001B[39m\u001B[2m) // Object.is equality\u001B[22m\n' +
    '\n' +
    'Expected: \u001B[32m1\u001B[39m\n' +
    'Received: \u001B[31m10\u001B[39m\n' +
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
    'Error: \u001B[2mexpect(\u001B[22m\u001B[31mreceived\u001B[39m\u001B[2m).\u001B[22mtoBeFalsy\u001B[2m()\u001B[22m\n' +
    '\n' +
    'Received: \u001B[31mtrue\u001B[39m\n' +
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

  describe('logs error annotation', () => {
    test('when an expectation fails to pass', () => {
      reporter.generateAnnotations(testMeta, {
        testResults: [
          {
            ...testCaseResult,
            failureMessages: [expectationsErrorMessage],
          },
        ],
      } as TestResult);

      expect(mockedStderrWrite).toHaveBeenCalledTimes(1);
      expect(mockedStderrWrite.mock.calls[0]).toMatchSnapshot();
    });

    test('when a test has reference error', () => {
      reporter.generateAnnotations(
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

      expect(mockedStderrWrite).toHaveBeenCalledTimes(1);
      expect(mockedStderrWrite.mock.calls[0]).toMatchSnapshot();
    });

    test('when test is wrapped in describe block', () => {
      reporter.generateAnnotations(testMeta, {
        testResults: [
          {
            ...testCaseResult,
            ancestorTitles: ['describe'],
          },
        ],
      } as TestResult);

      expect(mockedStderrWrite).toHaveBeenCalledTimes(1);
      expect(mockedStderrWrite.mock.calls[0]).toMatchSnapshot();
    });
  });

  describe('logs warning annotation before logging errors', () => {
    test('when test result includes retry reasons', () => {
      reporter.generateAnnotations(testMeta, {
        testResults: [
          {
            ...testCaseResult,
            failureMessages: [retryErrorMessage],
            retryReasons: [retryErrorMessage],
          },
        ],
      } as TestResult);

      expect(mockedStderrWrite).toHaveBeenCalledTimes(2);
      expect(mockedStderrWrite.mock.calls).toMatchSnapshot();
    });
  });
});

describe('logs', () => {
  test('can be instantiated', () => {
    const gha = new GitHubActionsReporter(makeGlobalConfig());
    expect(gha).toBeTruthy();
    expect(gha).toBeInstanceOf(GitHubActionsReporter);
  });

  describe('Result tree generation', () => {
    test('failed single test without describe', () => {
      const testResults = [
        {
          ancestorTitles: [],
          duration: 10,
          status: 'failed',
          title: 'test',
        },
      ] as unknown as Array<AssertionResult>;
      const suitePerf = {
        end: 30,
        runtime: 20,
        slow: false,
        start: 10,
      };
      const expectedResults = {
        children: [
          {
            children: [],
            duration: 10,
            name: 'test',
            status: 'failed',
          },
        ],
        name: '/',
        passed: false,
        performanceInfo: {
          end: 30,
          runtime: 20,
          slow: false,
          start: 10,
        },
      };
      const gha = new GitHubActionsReporter(makeGlobalConfig(), {
        silent: false,
      });

      const generated = gha.getResultTree(testResults, '/', suitePerf);

      expect(mockedStderrWrite).not.toHaveBeenCalled();
      expect(generated).toEqual(expectedResults);
    });

    test('passed single test without describe', () => {
      const testResults = [
        {
          ancestorTitles: [],
          duration: 10,
          status: 'passed',
          title: 'test',
        },
      ] as unknown as Array<AssertionResult>;
      const suitePerf = {
        end: 30,
        runtime: 20,
        slow: false,
        start: 10,
      };
      const expectedResults = {
        children: [
          {
            children: [],
            duration: 10,
            name: 'test',
            status: 'passed',
          },
        ],
        name: '/',
        passed: true,
        performanceInfo: {
          end: 30,
          runtime: 20,
          slow: false,
          start: 10,
        },
      };
      const gha = new GitHubActionsReporter(makeGlobalConfig(), {
        silent: false,
      });

      const generated = gha.getResultTree(testResults, '/', suitePerf);

      expect(mockedStderrWrite).not.toHaveBeenCalled();
      expect(generated).toEqual(expectedResults);
    });

    test('failed single test inside describe', () => {
      const testResults = [
        {
          ancestorTitles: ['Test describe'],
          duration: 10,
          status: 'failed',
          title: 'test',
        },
      ] as unknown as Array<AssertionResult>;
      const suitePerf = {
        end: 30,
        runtime: 20,
        slow: false,
        start: 10,
      };
      const expectedResults = {
        children: [
          {
            children: [
              {
                children: [],
                duration: 10,
                name: 'test',
                status: 'failed',
              },
            ],
            name: 'Test describe',
            passed: false,
          },
        ],
        name: '/',
        passed: false,
        performanceInfo: {
          end: 30,
          runtime: 20,
          slow: false,
          start: 10,
        },
      };
      const gha = new GitHubActionsReporter(makeGlobalConfig(), {
        silent: false,
      });

      const generated = gha.getResultTree(testResults, '/', suitePerf);

      expect(mockedStderrWrite).not.toHaveBeenCalled();
      expect(generated).toEqual(expectedResults);
    });

    test('passed single test inside describe', () => {
      const testResults = [
        {
          ancestorTitles: ['Test describe'],
          duration: 10,
          status: 'passed',
          title: 'test',
        },
      ] as unknown as Array<AssertionResult>;
      const suitePerf = {
        end: 30,
        runtime: 20,
        slow: false,
        start: 10,
      };
      const expectedResults = {
        children: [
          {
            children: [
              {
                children: [],
                duration: 10,
                name: 'test',
                status: 'passed',
              },
            ],
            name: 'Test describe',
            passed: true,
          },
        ],
        name: '/',
        passed: true,
        performanceInfo: {
          end: 30,
          runtime: 20,
          slow: false,
          start: 10,
        },
      };
      const gha = new GitHubActionsReporter(makeGlobalConfig(), {
        silent: false,
      });

      const generated = gha.getResultTree(testResults, '/', suitePerf);

      expect(mockedStderrWrite).not.toHaveBeenCalled();
      expect(generated).toEqual(expectedResults);
    });

    test('skipped single test and todo single test inside describe', () => {
      const testResults = [
        {
          ancestorTitles: ['Test describe'],
          duration: 10,
          status: 'skipped',
          title: 'test',
        },
        {
          ancestorTitles: ['Test describe'],
          duration: 14,
          status: 'todo',
          title: 'test2',
        },
      ] as unknown as Array<AssertionResult>;
      const suitePerf = {
        end: 30,
        runtime: 20,
        slow: false,
        start: 10,
      };
      const expectedResults = {
        children: [
          {
            children: [
              {
                children: [],
                duration: 10,
                name: 'test',
                status: 'skipped',
              },
              {
                children: [],
                duration: 14,
                name: 'test2',
                status: 'todo',
              },
            ],
            name: 'Test describe',
            passed: true,
          },
        ],
        name: '/',
        passed: true,
        performanceInfo: {
          end: 30,
          runtime: 20,
          slow: false,
          start: 10,
        },
      };
      const gha = new GitHubActionsReporter(makeGlobalConfig(), {
        silent: false,
      });

      const generated = gha.getResultTree(testResults, '/', suitePerf);

      expect(mockedStderrWrite).not.toHaveBeenCalled();
      expect(generated).toEqual(expectedResults);
    });
  });

  describe('Result tree output', () => {
    test('failed single test without describe', () => {
      const generatedTree = {
        children: [
          {
            children: [],
            duration: 10,
            name: 'test',
            status: 'failed' as Status,
          },
        ],
        name: '/',
        passed: false,
        performanceInfo: {
          end: 30,
          runtime: 20,
          slow: false,
          start: 10,
        },
      };
      const gha = new GitHubActionsReporter(makeGlobalConfig(), {
        silent: false,
      });

      gha.printResultTree(generatedTree);

      expect(mockedStderrWrite.mock.calls).toMatchSnapshot();
    });

    test('passed single test without describe', () => {
      const generatedTree = {
        children: [
          {
            children: [],
            duration: 10,
            name: 'test',
            status: 'passed' as Status,
          },
        ],
        name: '/',
        passed: true,
        performanceInfo: {
          end: 30,
          runtime: 20,
          slow: false,
          start: 10,
        },
      };
      const gha = new GitHubActionsReporter(makeGlobalConfig(), {
        silent: false,
      });

      gha.printResultTree(generatedTree);

      expect(mockedStderrWrite.mock.calls).toMatchSnapshot();
    });

    test('failed single test inside describe', () => {
      const generatedTree = {
        children: [
          {
            children: [
              {
                children: [],
                duration: 10,
                name: 'test',
                status: 'failed' as Status,
              },
            ],
            name: 'Test describe',
            passed: false,
          },
        ],
        name: '/',
        passed: false,
        performanceInfo: {
          end: 30,
          runtime: 20,
          slow: false,
          start: 10,
        },
      };
      const gha = new GitHubActionsReporter(makeGlobalConfig(), {
        silent: false,
      });

      gha.printResultTree(generatedTree);

      expect(mockedStderrWrite.mock.calls).toMatchSnapshot();
    });

    test('passed single test inside describe', () => {
      const generatedTree = {
        children: [
          {
            children: [
              {
                children: [],
                duration: 10,
                name: 'test',
                status: 'passed' as Status,
              },
            ],
            name: 'Test describe',
            passed: true,
          },
        ],
        name: '/',
        passed: true,
        performanceInfo: {
          end: 30,
          runtime: 20,
          slow: false,
          start: 10,
        },
      };
      const gha = new GitHubActionsReporter(makeGlobalConfig(), {
        silent: false,
      });

      gha.printResultTree(generatedTree);

      expect(mockedStderrWrite.mock.calls).toMatchSnapshot();
    });

    test('todo single test inside describe', () => {
      const generatedTree = {
        children: [
          {
            children: [
              {
                children: [],
                duration: 10,
                name: 'test',
                status: 'todo' as Status,
              },
            ],
            name: 'Test describe',
            passed: true,
          },
        ],
        name: '/',
        passed: true,
        performanceInfo: {
          end: 30,
          runtime: 20,
          slow: false,
          start: 10,
        },
      };
      const gha = new GitHubActionsReporter(makeGlobalConfig(), {
        silent: false,
      });

      gha.printResultTree(generatedTree);

      expect(mockedStderrWrite.mock.calls).toMatchSnapshot();
    });

    test('skipped single test inside describe', () => {
      const generatedTree = {
        children: [
          {
            children: [
              {
                children: [],
                duration: 10,
                name: 'test',
                status: 'skipped' as Status,
              },
            ],
            name: 'Test describe',
            passed: true,
          },
        ],
        name: '/',
        passed: true,
        performanceInfo: {
          end: 30,
          runtime: 20,
          slow: false,
          start: 10,
        },
      };
      const gha = new GitHubActionsReporter(makeGlobalConfig(), {
        silent: false,
      });

      gha.printResultTree(generatedTree);

      expect(mockedStderrWrite.mock.calls).toMatchSnapshot();
    });
  });

  describe('Reporter interface', () => {
    test('onTestResult not last', () => {
      const mockTest = {
        context: {
          config: {
            rootDir: '/testDir',
          },
        },
      };
      const mockTestResult = {
        perfStats: {
          runtime: 20,
          slow: false,
        },
        testFilePath: '/testDir/test1.js',
        testResults: [
          {
            ancestorTitles: [],
            duration: 10,
            status: 'passed',
            title: 'test1',
          },
        ],
      };
      const mockResults = {
        numFailedTestSuites: 1,
        numPassedTestSuites: 1,
        numTotalTestSuites: 3,
      };
      const gha = new GitHubActionsReporter(makeGlobalConfig(), {
        silent: false,
      });
      gha.generateAnnotations = jest.fn();

      gha.onTestResult(
        mockTest as Test,
        mockTestResult as unknown as TestResult,
        mockResults as AggregatedResult,
      );

      expect(mockedStderrWrite.mock.calls).toMatchSnapshot();
    });

    test('onTestResult last', () => {
      const mockTest = {
        context: {
          config: {
            rootDir: '/testDir',
          },
        },
      };
      const mockTestResult = {
        failureMessage: 'Failure message',
        perfStats: {
          runtime: 20,
          slow: false,
        },
        testFilePath: '/testDir/test1.js',
        testResults: [
          {
            ancestorTitles: [],
            duration: 10,
            status: 'passed',
            title: 'test1',
          },
        ],
      };
      const mockResults = {
        numFailedTestSuites: 1,
        numPassedTestSuites: 2,
        numTotalTestSuites: 3,
        testResults: [mockTestResult],
      };
      const gha = new GitHubActionsReporter(makeGlobalConfig(), {
        silent: false,
      });
      gha.generateAnnotations = jest.fn();

      gha.onTestResult(
        mockTest as Test,
        mockTestResult as unknown as TestResult,
        mockResults as unknown as AggregatedResult,
      );

      expect(mockedStderrWrite.mock.calls).toMatchSnapshot();
    });

    test('onTestResult last with console output for failed test', () => {
      const mockTest = {
        context: {
          config: {
            rootDir: '/testDir',
          },
        },
      };
      const mockTestResult = {
        console: [
          {
            message: 'bar',
            origin:
              '    at Object.log (/tmp/jest-test/a.test.js:2:13)\n    at Promise.finally.completed (/github.com/jestjs/jest/packages/jest-circus/build/jestAdapterInit.js:1557:28)',
            type: 'log',
          },
        ],
        failureMessage: 'Failure message',
        perfStats: {
          runtime: 20,
          slow: false,
        },
        testFilePath: '/testDir/test1.js',
        testResults: [
          {
            ancestorTitles: [],
            duration: 10,
            status: 'passed',
            title: 'test1',
          },
        ],
      };
      const mockResults = {
        numFailedTestSuites: 1,
        numPassedTestSuites: 2,
        numTotalTestSuites: 3,
        testResults: [mockTestResult],
      };
      const gha = new GitHubActionsReporter(makeGlobalConfig(), {
        silent: false,
      });
      gha.generateAnnotations = jest.fn();

      gha.onTestResult(
        mockTest as Test,
        mockTestResult as unknown as TestResult,
        mockResults as unknown as AggregatedResult,
      );

      expect(mockedStderrWrite.mock.calls).toMatchSnapshot();
    });

    test('onTestResult last with console output for success test', () => {
      const mockTest = {
        context: {
          config: {
            rootDir: '/testDir',
          },
        },
      };
      const mockTestResult = {
        console: [
          {
            message: 'bar',
            origin:
              '    at Object.log (/tmp/jest-test/a.test.js:2:13)\n    at Promise.finally.completed (/github.com/jestjs/jest/packages/jest-circus/build/jestAdapterInit.js:1557:28)',
            type: 'log',
          },
        ],
        perfStats: {
          runtime: 20,
          slow: false,
        },
        testFilePath: '/testDir/test1.js',
        testResults: [
          {
            ancestorTitles: [],
            duration: 10,
            status: 'passed',
            title: 'test1',
          },
        ],
      };
      const mockResults = {
        numFailedTestSuites: 0,
        numPassedTestSuites: 1,
        numTotalTestSuites: 1,
        testResults: [mockTestResult],
      };
      const gha = new GitHubActionsReporter(makeGlobalConfig(), {
        silent: false,
      });
      gha.generateAnnotations = jest.fn();

      gha.onTestResult(
        mockTest as Test,
        mockTestResult as unknown as TestResult,
        mockResults as unknown as AggregatedResult,
      );

      expect(mockedStderrWrite.mock.calls).toMatchSnapshot();
    });
  });
});
