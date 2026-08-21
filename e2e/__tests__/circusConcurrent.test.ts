/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {skipSuiteOnJasmine} from '@jest/test-utils';
import runJest, {json as runWithJson} from '../runJest';

skipSuiteOnJasmine();

jest.retryTimes(3);

describe('all passing', () => {
  it('runs the correct number of tests', () => {
    const {json, exitCode} = runWithJson('circus-concurrent', [
      'concurrent.test.js',
    ]);

    expect(exitCode).toBe(0);
    expect(json.numTotalTests).toBe(12);
    expect(json.numPassedTests).toBe(12);
    expect(json.numFailedTests).toBe(0);
    expect(json.numPendingTests).toBe(0);
  });

  it('runs the tests in the correct order', () => {
    const {stdout} = runJest('circus-concurrent', ['concurrent.test.js']);
    expect(stdout).toMatchSnapshot();
  });
});

describe('with skip', () => {
  it('runs the correct number of tests', () => {
    const {json, exitCode} = runWithJson('circus-concurrent', [
      'concurrent-skip.test.js',
    ]);

    expect(exitCode).toBe(0);
    expect(json.numTotalTests).toBe(10);
    expect(json.numPassedTests).toBe(6);
    expect(json.numFailedTests).toBe(0);
    expect(json.numPendingTests).toBe(4);
  });

  it('runs the tests in the correct order', () => {
    const {stdout} = runJest('circus-concurrent', ['concurrent-skip.test.js']);
    expect(stdout).toMatchSnapshot();
  });
});

describe('expect.assertions', () => {
  it('passes when each concurrent test meets its own assertion budget', () => {
    const {json, exitCode} = runWithJson('circus-concurrent', [
      'concurrent-assertions.test.js',
    ]);

    expect(exitCode).toBe(0);
    expect(json.numTotalTests).toBe(4);
    expect(json.numPassedTests).toBe(4);
    expect(json.numFailedTests).toBe(0);
  });

  it('fails only the concurrent test that exceeded its assertion budget', () => {
    const {json, exitCode, stderr} = runWithJson('circus-concurrent', [
      'concurrent-assertions-fail.test.js',
    ]);

    expect(exitCode).toBe(1);
    expect(json.numTotalTests).toBe(2);
    expect(json.numPassedTests).toBe(1);
    expect(json.numFailedTests).toBe(1);
    expect(stderr).toMatch(
      /Expected one assertion to be called but received two assertion calls/,
    );
    expect(json.testResults[0].assertionResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({status: 'passed', title: 'ok sibling'}),
        expect.objectContaining({
          status: 'failed',
          title: 'too many assertions',
        }),
      ]),
    );
  });
});

describe('with only', () => {
  it('runs the correct number of tests', () => {
    const {json, exitCode} = runWithJson('circus-concurrent', [
      'concurrent-only.test.js',
    ]);

    expect(exitCode).toBe(0);
    expect(json.numTotalTests).toBe(10);
    expect(json.numPassedTests).toBe(3);
    expect(json.numFailedTests).toBe(0);
    expect(json.numPendingTests).toBe(7);
  });

  it('runs the tests in the correct order', () => {
    const {stdout} = runJest('circus-concurrent', ['concurrent-only.test.js']);
    expect(stdout).toMatchSnapshot();
  });
});
