/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../no-tests-found-test');

describe('No tests are found', () => {
  test('fails the test suite in standard situation', () => {
    const {exitCode, stdout} = runJest(DIR, [
      '--testPathPattern',
      '/non/existing/path/',
    ]);

    expect(stdout).toContain('No tests found, exiting with code 1');
    expect(stdout).toContain(
      'Run with `--passWithNoTests` to exit with code 0',
    );
    expect(exitCode).toBe(1);
  });

  test("doesn't fail the test suite if --passWithNoTests passed", () => {
    const {exitCode, stdout} = runJest(DIR, [
      '--testPathPattern',
      '/non/existing/path/',
      '--passWithNoTests',
    ]);

    expect(stdout).toContain('No tests found, exiting with code 0');
    expect(stdout).not.toContain(
      'Run with `--passWithNoTests` to exit with code 0',
    );
    expect(exitCode).toBe(0);
  });

  test("doesn't fail the test suite if using --lastCommit", () => {
    // Since there are no files in DIR no tests will be found
    const {exitCode, stdout} = runJest(DIR, ['--lastCommit']);

    expect(stdout).toContain(
      'No tests found related to files changed since last commit.',
    );
    expect(stdout).not.toContain(
      'Run with `--passWithNoTests` to exit with code 0',
    );
    expect(exitCode).toBe(0);
  });

  test("doesn't fail the test suite if using --onlyChanged", () => {
    // Since there are no files in DIR no tests will be found
    const {exitCode, stdout} = runJest(DIR, ['--onlyChanged']);

    expect(stdout).toContain(
      'No tests found related to files changed since last commit.',
    );
    expect(stdout).not.toContain(
      'Run with `--passWithNoTests` to exit with code 0',
    );
    expect(exitCode).toBe(0);
  });

  test('fails the test suite if using --findRelatedTests', () => {
    // Since there are no files in DIR no tests will be found
    const {exitCode, stdout} = runJest(DIR, [
      '--findRelatedTests',
      '/non/existing/path',
    ]);

    expect(stdout).toContain('No tests found, exiting with code 1');
    expect(stdout).toContain(
      'Run with `--passWithNoTests` to exit with code 0',
    );
    expect(exitCode).toBe(1);
  });

  test("doesn't fail the test suite if using --findRelatedTests and --passWithNoTests", () => {
    // Since there are no files in DIR no tests will be found
    const {exitCode, stdout} = runJest(DIR, [
      '--findRelatedTests',
      '/non/existing/path',
      '--passWithNoTests',
    ]);

    expect(stdout).toContain('No tests found, exiting with code 0');
    expect(stdout).not.toContain(
      'Run with `--passWithNoTests` to exit with code 0',
    );
    expect(exitCode).toBe(0);
  });
});
