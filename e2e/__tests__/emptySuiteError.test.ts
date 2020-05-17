/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../empty-suite-error');

describe('JSON Reporter', () => {
  it('fails the test suite if it contains no tests', () => {
    const {stdout} = runJest(DIR, []);
    expect(stdout).toMatch('Test suite failed to run');
    expect(stdout).toMatch('Your test suite must contain at least one test.');
  });
});
