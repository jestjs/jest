/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const assert = require('assert');
const baseConfig = require('./jest.config');

const {
  modulePathIgnorePatterns,
  testPathIgnorePatterns,
  watchPathIgnorePatterns,
} = baseConfig;

assert.strictEqual(
  testPathIgnorePatterns[0],
  '/test-types/',
  'First entry must be types',
);

module.exports = {
  displayName: {
    color: 'blue',
    name: 'types',
  },
  modulePathIgnorePatterns,
  runner: 'jest-runner-tsd',
  testMatch: ['<rootDir>/test-types/*.test.ts'],
  testPathIgnorePatterns: testPathIgnorePatterns.slice(1),
  watchPathIgnorePatterns,
};
