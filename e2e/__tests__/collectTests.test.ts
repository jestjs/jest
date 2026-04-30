/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

describe('jest --collect-tests', () => {
  test('lists test names without executing test bodies', () => {
    const {exitCode, stdout} = runJest('each', [
      '--collect-tests',
      '--testPathPatterns=success',
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("The word red contains the letter 'e'");
    expect(stdout).toContain('passes one row expected true == true');
    expect(stdout).toContain('passes all rows expected true == true');
    expect(stdout).toContain('success.test.js');
  });

  test('produces valid JSON with --json', () => {
    const {exitCode, stdout} = runJest('each', [
      '--collect-tests',
      '--json',
      '--testPathPatterns=success',
    ]);

    expect(exitCode).toBe(0);
    const json = JSON.parse(stdout);
    expect(json.success).toBe(true);
    expect(json.numTotalTestSuites).toBe(1);
    expect(json.numPendingTests).toBeGreaterThan(0);

    const testFile = json.testResults[0];
    expect(testFile.name).toContain('success.test.js');
    for (const assertion of testFile.assertionResults) {
      expect(assertion.status).toBe('pending');
    }
  });

  test('does not execute tests (failing tests still exit 0)', () => {
    const {exitCode, stdout} = runJest('each', [
      '--collect-tests',
      '--testPathPatterns=failure',
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('failure.test.js');
    expect(stdout).toContain('fails');
  });

  test('filters correctly with --testNamePattern', () => {
    const {exitCode, stdout} = runJest('each', [
      '--collect-tests',
      '--testPathPatterns=success',
      '--testNamePattern=one row',
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('passes one row expected');
    expect(stdout).not.toContain("The word red contains the letter 'e'");
  });

  test('exits 0 even when no tests match', () => {
    const {exitCode, stdout} = runJest('each', [
      '--collect-tests',
      '--testPathPatterns=nonexistent',
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('No tests found');
  });
});
