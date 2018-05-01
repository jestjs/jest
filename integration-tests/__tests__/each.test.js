/**
 * Copyright (c) 2018-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const path = require('path');
const SkipOnWindows = require('../../scripts/SkipOnWindows');
const runJest = require('../runJest');
const {extractSummary} = require('../Utils');
const dir = path.resolve(__dirname, '../each');

SkipOnWindows.suite();

test('works with passing tests', () => {
  const result = runJest(dir, ['success.test.js']);
  expect(result.status).toBe(0);
});

test('shows error message when not enough arguments are supplied to tests', () => {
  const result = runJest(dir, ['each-exception.test.js']);
  const rest = extractSummary(result.stderr)
    .rest.split('\n')
    .filter(line => line.indexOf('packages/expect/build/index.js') === -1)
    .join('\n');

  expect(result.status).toBe(1);
  expect(rest).toMatchSnapshot();
});

test('shows the correct errors in stderr when failing tests', () => {
  const result = runJest(dir, ['failure.test.js']);

  expect(result.status).toBe(1);

  const rest = extractSummary(result.stderr)
    .rest.split('\n')
    .filter(line => line.indexOf('packages/expect/build/index.js') === -1)
    .map(line => line.trim())
    .join('\n');

  expect(rest).toMatchSnapshot();
});

test('shows only the tests with .only as being ran', () => {
  const result = runJest(dir, ['each-only.test.js']);

  expect(result.status).toBe(0);

  const rest = extractSummary(result.stderr)
    .rest.split('\n')
    .filter(line => line.indexOf('packages/expect/build/index.js') === -1)
    .join('\n');

  expect(rest).toMatchSnapshot();
});

test('shows only the tests without .skip as being ran', () => {
  const result = runJest(dir, ['each-skip.test.js']);

  expect(result.status).toBe(0);

  const rest = extractSummary(result.stderr)
    .rest.split('\n')
    .filter(line => line.indexOf('packages/expect/build/index.js') === -1)
    .join('\n');

  expect(rest).toMatchSnapshot();
});
