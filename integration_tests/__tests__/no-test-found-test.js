/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

const runJest = require('../runJest');

describe('Coverage Report', () => {
  it('outputs coverage report', () => {
    const result = runJest('coverage_report', ['not-a-valid-test']);
    const stdout = result.stdout.toString();

    expect(stdout).toMatch('No tests found');

    expect(stdout).not.toMatch('0 tests passed');
  });
});
