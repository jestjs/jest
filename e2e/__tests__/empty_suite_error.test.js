/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

'use strict';

const path = require('path');
const runJest = require('../runJest');

const DIR = path.resolve(__dirname, '../empty-suite-error');

describe('JSON Reporter', () => {
  it('fails the test suite if it contains no tests', () => {
    const {stderr} = runJest(DIR, []);
    expect(stderr).toMatch('Test suite failed to run');
    expect(stderr).toMatch('Your test suite must contain at least one test.');
  });
});
