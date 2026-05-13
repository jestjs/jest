/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Test} from '@jest/test-result';
import {makeProjectConfig} from '@jest/test-utils';
import type {BrowserTestResult} from '../index';
import {buildTestResult} from '../buildTestResult';

function makeTest(path: string): Test {
  return {
    context: {
      config: makeProjectConfig({
        displayName: {color: 'white', name: 'browser-project'},
      }),
    },
    path,
  } as unknown as Test;
}

describe('buildTestResult', () => {
  test('converts BrowserTestResult to Jest TestResult and maps pass/fail', () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(2000);

    const test = makeTest('/repo/math.test.ts');
    const browserResult: BrowserTestResult = {
      failed: 1,
      passed: 1,
      results: [
        {
          duration: 7,
          name: 'sum > adds numbers',
          status: 'passed',
        },
        {
          duration: 3,
          error: 'Expected 4 but received 5',
          name: 'sum > fails on mismatch',
          status: 'failed',
        },
      ],
      testPath: '/repo/math.test.ts',
      total: 2,
    };

    const result = buildTestResult(test, browserResult);

    expect(result.numPassingTests).toBe(1);
    expect(result.numFailingTests).toBe(1);
    expect(result.testResults).toHaveLength(2);
    expect(result.testResults[0]).toEqual(
      expect.objectContaining({
        ancestorTitles: ['sum'],
        status: 'passed',
        title: 'adds numbers',
      }),
    );
    expect(result.testResults[1]).toEqual(
      expect.objectContaining({
        ancestorTitles: ['sum'],
        failureMessages: ['Expected 4 but received 5'],
        status: 'failed',
        title: 'fails on mismatch',
      }),
    );
    expect(result.failureMessage).toContain('Expected 4 but received 5');

    nowSpy.mockRestore();
  });

  test('handles empty browser results', () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(3000);

    const test = makeTest('/repo/empty.test.ts');
    const browserResult: BrowserTestResult = {
      failed: 0,
      passed: 0,
      results: [],
      testPath: '/repo/empty.test.ts',
      total: 0,
    };

    const result = buildTestResult(test, browserResult);

    expect(result.numPassingTests).toBe(0);
    expect(result.numFailingTests).toBe(0);
    expect(result.testResults).toEqual([]);
    expect(result.failureMessage).toBeUndefined();

    nowSpy.mockRestore();
  });
});
