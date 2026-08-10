/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import formatTestResults from '../formatTestResults';
import type {AggregatedResult, AssertionResult} from '../types';

describe('formatTestResults', () => {
  it('includes test full name', () => {
    const assertion = {
      fullName: 'TestedModule#aMethod when some condition is met returns true',
      status: 'passed',
      title: 'returns true',
    } as AssertionResult;

    const results = {
      testResults: [
        {
          numFailingTests: 0,
          perfStats: {end: 2, runtime: 1, slow: false, start: 1},
          testResults: [assertion],
        },
      ],
    } as AggregatedResult;

    const result = formatTestResults(results, undefined, null);
    expect(result.testResults[0].assertionResults[0].fullName).toEqual(
      assertion.fullName,
    );
  });

  it('should mark result status to skipped', () => {
    const skippedAssertion = {
      fullName: 'Pending test',
      status: 'pending',
      title: 'is still pending',
    } as AssertionResult;

    const skippedResults = {
      testResults: [
        {
          numFailingTests: 0,
          numPassingTests: 0,
          numPendingTests: 2,
          numTodoTests: 2,
          perfStats: {end: 2, runtime: 1, slow: false, start: 1},
          testResults: [skippedAssertion],
        },
      ],
    } as AggregatedResult;

    const result = formatTestResults(skippedResults, undefined, null);
    expect(result.testResults[0].assertionResults[0].status).toEqual(
      skippedAssertion.status,
    );
  });

  it('should mark result status to focused', () => {
    const focusedAssertion = {
      fullName: 'Focused test',
      status: 'focused',
      title: 'focused test',
    } as AssertionResult;

    const focusedResults = {
      testResults: [
        {
          numFailingTests: 0,
          numPassingTests: 1,
          numPendingTests: 1,
          numTodoTests: 2,
          perfStats: {end: 2, runtime: 1, slow: false, start: 1},
          testResults: [focusedAssertion],
        },
      ],
    } as AggregatedResult;

    const result = formatTestResults(focusedResults, undefined, null);
    expect(result.testResults[0].assertionResults[0].status).toEqual(
      focusedAssertion.status,
    );
  });
});
