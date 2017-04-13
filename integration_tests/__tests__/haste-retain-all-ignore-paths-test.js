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

it('does not run tests in node_modules/', () => {
  const result = runJest.json('haste-retain-all-ignore-paths').json;

  const testNames = result.testResults.map(res => res.name).sort();

  expect(
    testNames.some(x => x.includes('library/__tests__/shouldnt-run.js')),
  ).toBe(false);
});

it('runs tests in src/node_modules/', () => {
  const result = runJest.json('haste-retain-all-ignore-paths').json;

  const testNames = result.testResults.map(res => res.name).sort();

  expect(
    testNames.some(x => x.includes('src-library/__tests__/should-run.js')),
  ).toBe(true);
});
