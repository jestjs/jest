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

describe('--listTests flag', () => {
  it('causes tests to be printed out as JSON', () => {
    const {status, stdout} = runJest('list_tests', ['--listTests']);

    expect(status).toBe(0);
    expect(() => JSON.parse(stdout)).not.toThrow();
  });
});
