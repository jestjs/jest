/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

const skipOnWindows = require('skipOnWindows');
const runJest = require('../runJest');

describe('Regex Char In Path', () => {
  skipOnWindows.suite();

  it('parses paths containing regex chars correctly', () => {
    const {json} = runJest.json('regex-(char-in-path', []);

    expect(json.numTotalTests).toBe(1);
    expect(json.numPassedTests).toBe(1);
  });
});
