/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const {linkJestPackage} = require('../utils');
const path = require('path');
const runJest = require('../runJest');

describe('jest --debug', () => {
  const dir = path.resolve(__dirname, '..', 'verbose_reporter');

  beforeEach(() => {
    linkJestPackage('babel-jest', dir);
  });

  it('outputs debugging info before running the test', () => {
    const {stdout} = runJest(dir, ['--debug', '--no-cache']);
    expect(stdout).toMatch('jest version =');
    expect(stdout).toMatch('test framework = jasmine2');
    expect(stdout).toMatch('config = {');
    // config contains many file paths so we cannot do snapshot test
  });
});
