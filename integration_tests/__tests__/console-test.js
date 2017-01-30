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

const {extractSummary} = require('../utils');
const runJest = require('../runJest');
const skipOnWindows = require('skipOnWindows');

skipOnWindows.suite();

test('console printing', () => {
  const {stderr, status} = runJest('console', ['console-test.js']);
  const {summary, rest} = extractSummary(stderr);

  expect(status).toBe(0);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('console printing with --verbose', () => {
  const {stderr, stdout, status} =
    runJest('console', ['console-test.js', '--verbose', '--no-cache']);
  const {summary, rest} = extractSummary(stderr);

  expect(status).toBe(0);
  expect(stdout).toMatchSnapshot();
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('prints console messages if test suite fails to run', () => {
  const {stdout} = runJest('console', ['error-outside']);
  expect(stdout).toMatch('HEY, I SHOULD BE PRINTED');
});

test('prints console messages if test suite fails to run --verbose', () => {
  const {stdout} = runJest('console', ['error-outside', '--verbose']);
  expect(stdout).toMatch('HEY, I SHOULD BE PRINTED');
});
