/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// copied from https://github.com/MatteoH2O1999/github-actions-jest-reporter/blob/master/tests/gha.reporter.test.js

import util from 'util';
import chalk from 'chalk';
import {beforeEach, describe, expect, jest, test} from '@jest/globals';
import BaseReporter from '../BaseReporter';
import GhaReporter from '../GitHubActionsReporter';

const xSymbol = '\u00D7';
const ySymbol = '\u2713';

let consoleLog;
const mockLog = jest
  .spyOn(BaseReporter.prototype, 'log')
  .mockImplementation(message => {
    consoleLog = consoleLog.concat(message);
  });

beforeEach(() => {
  consoleLog = '';
});

test('can be instantiated', () => {
  const gha = new GhaReporter();
  expect(gha).toBeTruthy();
  expect(gha).toBeInstanceOf(GhaReporter);
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
    ];
    const testContext = {};
    const suitePerf = {
      runtime: 20,
      slow: false,
    };
    const expectedResults = {
      children: [
        {
          children: [],
          duration: 10,
          name: 'test',
          passed: false,
        },
      ],
      name: '/',
      passed: false,
      performanceInfo: {
        runtime: 20,
        slow: false,
      },
    };
    const gha = new GhaReporter();

    const generated = gha.getResultTree(testResults, '/', suitePerf);

    expect(consoleLog).toBe('');
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
    ];
    const testContext = {};
    const suitePerf = {
      runtime: 20,
      slow: false,
    };
    const expectedResults = {
      children: [
        {
          children: [],
          duration: 10,
          name: 'test',
          passed: true,
        },
      ],
      name: '/',
      passed: true,
      performanceInfo: {
        runtime: 20,
        slow: false,
      },
    };
    const gha = new GhaReporter();

    const generated = gha.getResultTree(testResults, '/', suitePerf);

    expect(consoleLog).toBe('');
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
    ];
    const testContext = {};
    const suitePerf = {
      runtime: 20,
      slow: false,
    };
    const expectedResults = {
      children: [
        {
          children: [
            {
              children: [],
              duration: 10,
              name: 'test',
              passed: false,
            },
          ],
          name: 'Test describe',
          passed: false,
        },
      ],
      name: '/',
      passed: false,
      performanceInfo: {
        runtime: 20,
        slow: false,
      },
    };
    const gha = new GhaReporter();

    const generated = gha.getResultTree(testResults, '/', suitePerf);

    expect(consoleLog).toBe('');
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
    ];
    const testContext = {};
    const suitePerf = {
      runtime: 20,
      slow: false,
    };
    const expectedResults = {
      children: [
        {
          children: [
            {
              children: [],
              duration: 10,
              name: 'test',
              passed: true,
            },
          ],
          name: 'Test describe',
          passed: true,
        },
      ],
      name: '/',
      passed: true,
      performanceInfo: {
        runtime: 20,
        slow: false,
      },
    };
    const gha = new GhaReporter();

    const generated = gha.getResultTree(testResults, '/', suitePerf);

    expect(consoleLog).toBe('');
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
          passed: false,
        },
      ],
      name: '/',
      passed: false,
      performanceInfo: {
        runtime: 20,
        slow: false,
      },
    };
    const testContext = {};
    const expectedOutput = `  ${chalk.bold.red.inverse(
      'FAIL',
    )} / (20 ms)    ${chalk.red(xSymbol)} test (10 ms)`;
    const gha = new GhaReporter();

    gha.printResultTree(generatedTree);

    expect(consoleLog).toEqual(expectedOutput);
  });

  test('passed single test without describe', () => {
    const generatedTree = {
      children: [
        {
          children: [],
          duration: 10,
          name: 'test',
          passed: true,
        },
      ],
      name: '/',
      passed: true,
      performanceInfo: {
        runtime: 20,
        slow: false,
      },
    };
    const testContext = {};
    const expectedOutput = `::group::${chalk.bold.green.inverse(
      'PASS',
    )} / (20 ms)  ${chalk.green(ySymbol)} test (10 ms)::endgroup::`;
    const gha = new GhaReporter();

    gha.printResultTree(generatedTree);

    expect(consoleLog).toEqual(expectedOutput);
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
              passed: false,
            },
          ],
          name: 'Test describe',
          passed: false,
        },
      ],
      name: '/',
      passed: false,
      performanceInfo: {
        runtime: 20,
        slow: false,
      },
    };
    const testContext = {};
    const expectedOutput =
      `  ${chalk.bold.red.inverse('FAIL')} / (20 ms)` +
      '    Test describe' +
      `      ${chalk.red(xSymbol)} test (10 ms)`;
    const gha = new GhaReporter();

    gha.printResultTree(generatedTree);

    expect(consoleLog).toEqual(expectedOutput);
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
              passed: true,
            },
          ],
          name: 'Test describe',
          passed: true,
        },
      ],
      name: '/',
      passed: true,
      performanceInfo: {
        runtime: 20,
        slow: false,
      },
    };
    const testContext = {};
    const expectedOutput =
      `::group::${chalk.bold.green.inverse('PASS')} / (20 ms)` +
      '  Test describe' +
      `    ${chalk.green(ySymbol)} test (10 ms)` +
      '::endgroup::';
    const gha = new GhaReporter();

    gha.printResultTree(generatedTree);

    expect(consoleLog).toEqual(expectedOutput);
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
    const expectedOutput =
      `::group::${chalk.bold.green.inverse('PASS')} test1.js (20 ms)` +
      `  ${chalk.green(ySymbol)} test1 (10 ms)` +
      '::endgroup::';
    const gha = new GhaReporter();
    gha.generateAnnotations = jest.fn();

    gha.onTestResult(mockTest, mockTestResult, mockResults);

    expect(consoleLog).toEqual(expectedOutput);
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
    const expectedOutput =
      `::group::${chalk.bold.green.inverse('PASS')} test1.js (20 ms)` +
      `  ${chalk.green(ySymbol)} test1 (10 ms)` +
      '::endgroup::' +
      '::group::Errors thrown in test1.js' +
      'Failure message' +
      '::endgroup::';
    const gha = new GhaReporter();
    gha.generateAnnotations = jest.fn();

    gha.onTestResult(mockTest, mockTestResult, mockResults);

    expect(consoleLog).toEqual(expectedOutput);
  });
});
