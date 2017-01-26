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
  const {stderr, status} = runJest('console');
  const {summary, rest} = extractSummary(stderr);

  expect(status).toBe(0);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('console printing with --summary', () => {
  const {stderr, stdout, status} =
    runJest('console', ['--summary', '--no-cache']);
  const {summary, rest} = extractSummary(stderr);

  expect(status).toBe(0);
  expect(stdout).toMatchSnapshot();
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('console printing with --verbose', () => {
  const {stderr, stdout, status} =
    runJest('console', ['--verbose', '--no-cache']);
  const {summary, rest} = extractSummary(stderr);

  expect(status).toBe(0);
  expect(stdout).toMatchSnapshot();
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});
