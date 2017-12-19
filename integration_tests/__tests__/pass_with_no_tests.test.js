/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const path = require('path');
const runJest = require('../runJest');

const DIR = path.resolve(__dirname, '../pass_with_no_tests-test');

describe('jest --passWithNoTests', () => {
  test('fails the test suite if no files are found', () => {
    const result = runJest(DIR, ['--testPathPattern', '/non/existing/path/']);
    const status = result.status;
    const stdout = result.stdout.toString();

    expect(stdout).toMatch('No tests found');
    expect(status).toBe(1);
  });

  test("doesn't fail the test suite if no files are found", () => {
    const result = runJest(DIR, [
      '--testPathPattern',
      '/non/existing/path/',
      '--passWithNoTests',
    ]);
    const status = result.status;
    const stdout = result.stdout.toString();

    expect(stdout).toMatch('No tests found');
    expect(status).toBe(0);
  });
});
