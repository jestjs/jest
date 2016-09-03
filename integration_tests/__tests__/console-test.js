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

test('console printing', () => {
  const result = runJest('console');
  const stderr = result.stderr.toString();

  expect(result.status).toBe(0);

  // Remove last two lines because they contain timing information.
  const output = stderr.split('\n').slice(0, -2).join('\n');
  expect(output).toMatchSnapshot();
});

test('console printing with --verbose', () => {
  const result = runJest('console', ['--verbose', '--no-cache']);
  const stdout = result.stdout.toString();

  expect(result.status).toBe(0);

  expect(stdout).toMatchSnapshot();
});
