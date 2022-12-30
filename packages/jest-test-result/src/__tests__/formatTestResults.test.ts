/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import formatTestResults from '../formatTestResults';
import {AggregatedResult} from '../types';

describe('formatTestResults', () => {
  const assertion = {
    fullName: 'TestedModule#aMethod when some condition is met returns true',
    status: 'passed',
    title: 'returns true',
  };

  const results: AggregatedResult = {
    testResults: [
      {
        numFailingTests: 0,
        perfStats: {end: 2, runtime: 1, slow: false, start: 1},
        // @ts-expect-error
        testResults: [assertion],
      },
    ],
  };

  const skippedAssertion = {
    fullName: 'Pending test',
    status: 'pending',
    title: 'is still pending',
  };

  const skippedResults: AggregatedResult = {
    testResults: [
      {
        numFailingTests: 0,
        numPassingTests: 0,
        numPendingTests: 2,
        numTodoTests: 2,
        perfStats: {end: 2, runtime: 1, slow: false, start: 1},
        // @ts-expect-error
        testResults: [skippedAssertion],
      },
    ],
  };

  it('should mark result status to skipped', () => {
    const result = formatTestResults(skippedResults, undefined, null);
    expect(result.testResults[0].assertionResults[0].status).toEqual(
      skippedAssertion.status,
    );
  });

  const focusedAssertion = {
    fullName: 'Focused test',
    status: 'focused',
    title: 'focused test',
  };

  const focusedResults: AggregatedResult = {
    testResults: [
      {
        numFailingTests: 0,
        numPassingTests: 1,
        numPendingTests: 1,
        numTodoTests: 2,
        perfStats: {end: 2, runtime: 1, slow: false, start: 1},
        // @ts-expect-error
        testResults: [focusedAssertion],
      },
    ],
  };

  it('should mark result status to focused', () => {
    const result = formatTestResults(focusedResults, undefined, null);
    expect(result.testResults[0].assertionResults[0].status).toEqual(
      focusedAssertion.status,
    );
  });
});
