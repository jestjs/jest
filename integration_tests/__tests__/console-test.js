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
const {normalizePathsInSnapshot} = require('jest-util');

test('console printing', () => {
  // On Windows, this test only works when --no-cache is passed in. Need to
  // determine why.
  const result = runJest('console', ['--no-cache']);
  const stderr = result.stderr.toString();

  expect(result.status).toBe(0);

  // Remove last two lines because they contain timing information.
  const output = stderr.split('\n').slice(0, -2).join('\n');
  expect(normalizePathsInSnapshot(output)).toMatchSnapshot();
});

test('console printing with --verbose', () => {
  const result = runJest('console', ['--verbose', '--no-cache']);
  const stdout = result.stdout.toString();

  expect(result.status).toBe(0);

  expect(normalizePathsInSnapshot(stdout)).toMatchSnapshot();
});
