/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const path = require('path');
const skipOnWindows = require('skipOnWindows');
const runJest = require('../runJest');

describe('jest --debug', () => {
  skipOnWindows.suite();

  const dir = path.resolve(__dirname, '..', 'verbose_reporter');

  it('outputs debugging info before running the test', () => {
    const {stdout} = runJest(dir, ['--debug', '--no-cache']);
    expect(stdout).toMatch('"version": "');
    expect(stdout).toMatch('"configs": [');
    // config contains many file paths so we cannot do snapshot test
  });
});
