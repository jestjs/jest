/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
const runJest = require('../runJest');
const skipOnWindows = require('skipOnWindows');

describe('Custom Reporters', () => {
  skipOnWindows.suite();
  
  test('TestReporter with all tests passing', () => {
    const {
      stdout,
      status,
      stderr,
    } = runJest('custom_reporters', ['add-test.js']);
    let parsedJSON;

    try {
      parsedJSON = JSON.parse(stdout);
    } catch (error) {
      throw new Error(
        'Failed to parse JSON, Check the Output of TestReporter'
      );
    }

    const {onRunComplete, onRunStart, onTestResult, onTestStart} = parsedJSON;

    expect(status).toBe(0);
    expect(stderr.trim()).toBeFalsy();

    expect(onRunComplete.numPassedTests).toBe(1);
    expect(onRunComplete.numFailedTests).toBe(0);
    expect(onRunComplete.numTotalTests).toBe(1);

    expect(onRunStart.called).toBeTruthy();
    expect(onTestResult.called).toBeTruthy();
    expect(onTestStart.called).toBeTruthy();

    expect(parsedJSON).toMatchSnapshot();
  });

  test('TestReporter with all tests failing', () => {
    let parsedJSON;
    const {
      stdout,
      status,
      stderr,
    } = runJest('custom_reporters', ['add-fail-test.js']);
    
    try {
      parsedJSON = JSON.parse(stdout);
    } catch (error) {
      throw new Error('Failed to parse JSON. Check the output of TestReporter');
    }

    const {onTestStart, onTestResult, onRunStart, onRunComplete} = parsedJSON;

    expect(status).toBe(1);
    expect(stderr).toBeFalsy();

    expect(onRunComplete.numPassedTests).toBe(0);
    expect(onRunComplete.numFailedTests).toBe(1);
    expect(onRunComplete.numTotalTests).toBe(1);

    expect(onRunStart.called).toBeTruthy();
    expect(onTestStart.called).toBeTruthy();
    expect(onTestResult.called).toBeTruthy();

    expect(parsedJSON).toMatchSnapshot();
  });

  test('IncompleteReporter for flexibility', () => {
    const {stdout, status} = runJest('custom_reporters', [
      '--config',
      JSON.stringify({
        'reporters': [
          '<rootDir>/reporters/IncompleteReporter.js',
        ],
      }),
      'add-test.js',
    ]);

    expect(status).toBe(0);

    expect(stdout).toMatch('onRunComplete is called');
    expect(stdout).toMatch('Passed Tests: 1');
    expect(stdout).toMatch('Failed Tests: 0');
    expect(stdout).toMatch('Total Tests: 1');

    expect(stdout).toMatchSnapshot();
  });
});
