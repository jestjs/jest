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

const testFixturePackage = require('../test-environment/package.json');

it('respects testEnvironment docblock', () => {
  expect(testFixturePackage.jest.testEnvironment).toEqual('node');

  const result = runJest.json('test-environment').json;

  expect(result.success).toBe(true);
  expect(result.numTotalTests).toBe(1);
});
