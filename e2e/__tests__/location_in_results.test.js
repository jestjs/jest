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
const ConditionalTest = require('../../scripts/ConditionalTest');

it('defaults to null for location', () => {
  const result = runJest.json('location-in-results').json;

  const assertions = result.testResults[0].assertionResults;
  expect(result.success).toBe(true);
  expect(result.numTotalTests).toBe(2);
  expect(assertions[0].location).toBeNull();
  expect(assertions[1].location).toBeNull();
});

it('adds correct location info when provided with flag', () => {
  const result = runJest.json('location-in-results', [
    '--testLocationInResults',
  ]).json;

  const assertions = result.testResults[0].assertionResults;
  expect(result.success).toBe(true);
  expect(result.numTotalTests).toBe(2);
  expect(assertions[0].location).toEqual({column: 1, line: 10});

  // Technically the column should be 3, but callsites is not correct.
  // jest-circus uses stack-utils + asyncErrors which resolves this.
  expect(assertions[1].location).toEqual({
    column: ConditionalTest.isJestCircusRun() ? 3 : 2,
    line: 15,
  });
});
