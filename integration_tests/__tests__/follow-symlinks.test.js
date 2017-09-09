/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const runJest = require('../runJest');
const {extractSummary} = require('../utils');

test("Don't follow symlinks by default", () => {
  const {stdout} = runJest('follow-symlinks', []);
  expect(stdout).toMatch('No tests found');
});

test('Follow symlinks when followSymlinks flag is used', () => {
  const {stderr, stdout} = runJest('follow-symlinks', ['--followSymlinks']);
  expect(stdout).not.toMatch('No tests found');
  const {rest, summary} = extractSummary(stderr);
  expect(rest).not.toMatch('Test suite failed to run');
  expect(summary).toMatch('1 passed, 1 total');
});
