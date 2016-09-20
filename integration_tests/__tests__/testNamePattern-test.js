/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const runJest = require('../runJest');
const skipOnWindows = require('skipOnWindows');

skipOnWindows.suite();

test('testNamePattern', () => {
  const result = runJest.json('testNamePattern', [
    '--testNamePattern', 'should match',
  ]);

  expect(result.status).toBe(0);
  expect(result.json.numTotalTests).toBe(4);
  expect(result.json.numPassedTests).toBe(2);
  expect(result.json.numFailedTests).toBe(0);
});
