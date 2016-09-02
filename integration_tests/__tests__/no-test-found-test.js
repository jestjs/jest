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
const skipOnWindows = require('jest-util/build/skipOnWindows');

describe('Coverage Report', () => {
  skipOnWindows.suite();

  it('outputs coverage report', () => {
    const result = runJest('coverage_report', ['not-a-valid-test']);
    const stdout = result.stdout.toString();

    expect(stdout).toMatch('No tests found');

    expect(stdout).not.toMatch('0 tests passed');
  });
});
