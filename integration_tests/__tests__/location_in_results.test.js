/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

const runJest = require('../runJest');

it('defaults to null for location', () => {
  const result = runJest.json('location_in_results').json;

  const assertions = result.testResults[0].assertionResults;
  expect(result.success).toBe(true);
  expect(result.numTotalTests).toBe(2);
  expect(assertions[0].location).toBeNull();
  expect(assertions[1].location).toBeNull();
});

it('adds correct location info when provided with flag', () => {
  const result = runJest.json('location_in_results', [
    '--testLocationInResults',
  ]).json;

  const assertions = result.testResults[0].assertionResults;
  expect(result.success).toBe(true);
  expect(result.numTotalTests).toBe(2);
  expect(assertions[0].location).toEqual({column: 1, line: 9});
  expect(assertions[1].location).toEqual({column: 3, line: 14});
});
