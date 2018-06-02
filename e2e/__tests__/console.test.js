/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const {extractSummary} = require('../Utils');
const runJest = require('../runJest');

test('console printing', () => {
  const {stderr, status} = runJest('console');
  const {summary, rest} = extractSummary(stderr);

  expect(status).toBe(0);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('console printing with --verbose', () => {
  const {stderr, stdout, status} = runJest('console', [
    '--verbose',
    '--no-cache',
  ]);
  const {summary, rest} = extractSummary(stderr);

  expect(status).toBe(0);
  expect(stdout).toMatchSnapshot();
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('does not print to console with --silent', () => {
  const {stderr, stdout, status} = runJest('console', [
    // Need to pass --config because console test specifies `verbose: false`
    '--config=' +
      JSON.stringify({
        testEnvironment: 'node',
      }),
    '--silent',
    '--no-cache',
  ]);
  const {summary, rest} = extractSummary(stderr);

  expect(status).toBe(0);
  expect(stdout).toMatchSnapshot();
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

// issue: https://github.com/facebook/jest/issues/5223
test('the jsdom console is the same as the test console', () => {
  const {stderr, stdout, status} = runJest('console-jsdom');
  const {summary, rest} = extractSummary(stderr);

  expect(status).toBe(0);
  expect(stdout).toMatchSnapshot();
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});
