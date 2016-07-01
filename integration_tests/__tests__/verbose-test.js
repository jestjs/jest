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

describe('Verbose', () => {
  it('outputs coverage report', () => {
    const result = runJest('verbose_logger', ['--verbose']);
    const stdout = result.stdout.toString();

    expect(result.status).toBe(1);

    expect(stdout).toMatch('it works just fine');
    expect(stdout).toMatch('it does not work');
  });
});
