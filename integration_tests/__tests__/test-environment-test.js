/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

const runJest = require('../runJest');
const skipOnWindows = require('skipOnWindows');

skipOnWindows.suite();

const testFixturePackage = require('../test-environment/package.json');

it('respects testEnvironment docblock', () => {
  expect(testFixturePackage.jest.testEnvironment).toEqual('node');

  const result = runJest.json('test-environment').json;

  expect(result.success).toBe(true);
  expect(result.numTotalTests).toBe(1);
});
