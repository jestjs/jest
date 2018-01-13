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

const DIR = path.resolve(__dirname, '../no-tests-found-test');

describe('No tests are found', () => {
  test('fails the test suite in standard situation', () => {
    const result = runJest(DIR, ['--testPathPattern', '/non/existing/path/']);
    const status = result.status;
    const stdout = result.stdout.toString();

    expect(stdout).toMatch('No tests found');
    expect(status).toBe(1);
  });

  test("doesn't fail the test suite if --passWithNoTests passed", () => {
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

  test("doesn't fail the test suite if using --lastCommit", () => {
    // Since there are no files in DIR no tests will be found
    const result = runJest(DIR, ['--lastCommit']);
    const status = result.status;
    const stdout = result.stdout.toString();

    expect(stdout).toMatch('No tests found');
    expect(status).toBe(0);
  });

  test("doesn't fail the test suite if using --onlyChanged", () => {
    // Since there are no files in DIR no tests will be found
    const result = runJest(DIR, ['--onlyChanged']);
    const status = result.status;
    const stdout = result.stdout.toString();

    expect(stdout).toMatch('No tests found');
    expect(status).toBe(0);
  });

  test("doesn't fail the test suite if using --findRelatedTests", () => {
    // Since there are no files in DIR no tests will be found
    const result = runJest(DIR, ['--findRelatedTests', '/non/existing/path']);
    const status = result.status;
    const stdout = result.stdout.toString();

    expect(stdout).toMatch('No tests found');
    expect(status).toBe(0);
  });
});
