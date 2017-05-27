/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const path = require('path');
const runJest = require('../runJest');

const DIR = path.resolve(__dirname, '../fail_with_no_tests');

describe('jest --failWithNoTests', () => {
  test("doesn't fail the test suite if no files are found", () => {
    const result = runJest(DIR, ['--testPathPattern', '/non/existing/path/']);
    const status = result.status;
    const stdout = result.stdout.toString();

    expect(stdout).toMatch('No tests found');
    expect(status).toBe(0);
  });

  test('fails the test suite if no files are found', () => {
    const result = runJest(DIR, [
      '--testPathPattern',
      '/non/existing/path/',
      '--failWithNoTests',
    ]);
    const status = result.status;
    const stdout = result.stdout.toString();

    expect(stdout).toMatch('No tests found');
    expect(status).toBe(1);
  });
});
