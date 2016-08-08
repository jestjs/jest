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

describe('Regex Char In Path', () => {
  it('parses paths containing regex chars correctly', () => {
    const {stderr} = runJest('regex-(char-in-path', []);

    expect(stderr).not.toMatch('Invalid regular expression');
  });
});
