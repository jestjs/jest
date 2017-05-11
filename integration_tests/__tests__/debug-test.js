/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const path = require('path');
const skipOnWindows = require('skipOnWindows');
const {linkJestPackage} = require('../utils');
const runJest = require('../runJest');

describe('jest --debug', () => {
  skipOnWindows.suite();

  const dir = path.resolve(__dirname, '..', 'verbose_reporter');

  beforeEach(() => {
    if (process.platform !== 'win32') {
      linkJestPackage('babel-jest', dir);
    }
  });

  it('outputs debugging info before running the test', () => {
    const {stdout} = runJest(dir, ['--debug', '--no-cache']);
    expect(stdout).toMatch('"version": "');
    expect(stdout).toMatch('"framework": "jasmine2",');
    expect(stdout).toMatch('"config": {');
    // config contains many file paths so we cannot do snapshot test
  });
});
