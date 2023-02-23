/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isJestJasmineRun} from '@jest/test-utils';
import {json as runWithJson} from '../runJest';

it('defaults to null for location', () => {
  const {json: result} = runWithJson('location-in-results');

  const assertions = result.testResults[0].assertionResults;
  expect(result.success).toBe(true);
  expect(result.numTotalTests).toBe(10);
  expect(assertions).toHaveLength(10);
  for (const assertion of assertions) {
    expect(assertion.location).toBeNull();
  }
});

it('adds correct location info when provided with flag', () => {
  const {json: result} = runWithJson('location-in-results', [
    '--testLocationInResults',
  ]);

  const assertions = result.testResults[0].assertionResults;
  expect(result.success).toBe(true);
  expect(result.numTotalTests).toBe(10);

  expect(assertions[0].location).toEqual({
    column: 1,
    line: 10,
  });

  expect(assertions[1].location).toEqual({
    column: 1,
    line: 14,
  });

  expect(assertions[2].location).toEqual({
    column: 1,
    line: 19,
  });

  expect(assertions[3].location).toEqual({
    column: 22,
    line: 23,
  });

  expect(assertions[4].location).toEqual({
    column: 22,
    line: 23,
  });

  // Technically the column should be 3, but callsites is not correct.
  // jest-circus uses stack-utils + asyncErrors which resolves this.
  expect(assertions[5].location).toEqual({
    column: isJestJasmineRun() ? 2 : 3,
    line: 28,
  });

  expect(assertions[6].location).toEqual({
    column: isJestJasmineRun() ? 2 : 3,
    line: 32,
  });

  expect(assertions[7].location).toEqual({
    column: isJestJasmineRun() ? 2 : 3,
    line: 37,
  });

  expect(assertions[8].location).toEqual({
    column: 24,
    line: 41,
  });

  expect(assertions[9].location).toEqual({
    column: 24,
    line: 41,
  });
});
