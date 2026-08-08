/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {makeCollectedTestResult} from '../helpers';
import type {AssertionResult} from '../types';

const makeAssertion = (status: AssertionResult['status']): AssertionResult =>
  ({status, title: status}) as AssertionResult;

describe('makeCollectedTestResult', () => {
  test('tallies per-status counts, treating skipped/other as pending', () => {
    const result = makeCollectedTestResult(
      [
        makeAssertion('passed'),
        makeAssertion('passed'),
        makeAssertion('failed'),
        makeAssertion('todo'),
        makeAssertion('pending'),
        makeAssertion('skipped'),
        makeAssertion('disabled'),
      ],
      {displayName: undefined, testFilePath: '/some/file.test.js'},
    );

    expect(result.numPassingTests).toBe(2);
    expect(result.numFailingTests).toBe(1);
    expect(result.numTodoTests).toBe(1);
    // pending + skipped + disabled all count as pending.
    expect(result.numPendingTests).toBe(3);
    expect(result.testFilePath).toBe('/some/file.test.js');
    expect(result.testResults).toHaveLength(7);
  });

  test('carries the displayName and produces zero counts for no tests', () => {
    const displayName = {color: 'blue' as const, name: 'jasmine'};
    const result = makeCollectedTestResult([], {
      displayName,
      testFilePath: '/empty.test.js',
    });

    expect(result.displayName).toBe(displayName);
    expect(result.numPassingTests).toBe(0);
    expect(result.numPendingTests).toBe(0);
    expect(result.numTodoTests).toBe(0);
    expect(result.numFailingTests).toBe(0);
  });
});
