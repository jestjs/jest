/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

const COUNT_KEYS = [
  'numFailedTests',
  'numPassedTests',
  'numPendingTests',
  'numTodoTests',
  'numTotalTestSuites',
  'numTotalTests',
] as const;

type Counts = Record<(typeof COUNT_KEYS)[number], number>;

const counts = (result: Counts): Counts =>
  Object.fromEntries(COUNT_KEYS.map(key => [key, result[key]])) as Counts;

describe('jest --collect-tests', () => {
  // `test.failing` (xfail) collection parity is only implemented for the
  // default circus runner, so tests that rely on the kitchenSink fixture (which
  // uses `test.failing`) run on circus only. Focus parity is supported on both
  // runners and is exercised by a dedicated test below.
  const testOnCircus = process.env.JEST_JASMINE ? test.skip : test;

  test('prints a tree and summary without executing tests', () => {
    const {exitCode, stdout} = runJest('each', [
      '--collect-tests',
      '--testPathPatterns=success',
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('success.test.js');
    expect(stdout).toContain("The word red contains the letter 'e'");
    expect(stdout).toMatch(/Test suites:\s+1/);
    expect(stdout).toMatch(/Tests:\s+15 total/);
  });

  test('emits JSON with per-test status and the wouldRun flag', () => {
    const {exitCode, stdout} = runJest('each', [
      '--collect-tests',
      '--json',
      '--testPathPatterns=success',
    ]);

    expect(exitCode).toBe(0);
    const json = JSON.parse(stdout);
    expect(json.success).toBe(true);
    expect(json.numTotalTestSuites).toBe(1);

    const testFile = json.testResults[0];
    expect(testFile.name).toContain('success.test.js');
    // Every test in this fixture would run, so all collect to `passed` and are
    // flagged `wouldRun` (selected, but never executed).
    for (const assertion of testFile.assertionResults) {
      expect(assertion.status).toBe('passed');
      expect(assertion.wouldRun).toBe(true);
    }
  });

  testOnCircus('annotates skipped and todo tests in the tree', () => {
    const {exitCode, stdout} = runJest('collect-tests', [
      '--collect-tests',
      '--testPathPatterns=kitchenSink',
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('explicitly skipped [skipped]');
    expect(stdout).toContain('write this later [todo]');
    expect(stdout).toContain('deeply nested passes\n'); // runnable: unannotated
  });

  test('surfaces test files that fail to load', () => {
    const {exitCode, stdout} = runJest('collect-tests-load-error', [
      '--collect-tests',
    ]);

    // A file that throws while loading cannot be collected: it is reported with
    // its error, and the exit code is non-zero.
    expect(exitCode).not.toBe(0);
    expect(stdout).toContain('boom while loading this test file');
    expect(stdout).toMatch(/test suite\(s\) failed to load/);
    expect(stdout).toContain('this one collects fine'); // healthy file still listed
  });

  test('does not execute test bodies (failing tests still exit 0)', () => {
    const {exitCode, stdout} = runJest('each', [
      '--collect-tests',
      '--testPathPatterns=failure',
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('fails');
  });

  test('exits 0 when no tests match', () => {
    const {exitCode, stdout} = runJest('each', [
      '--collect-tests',
      '--testPathPatterns=nonexistent',
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('No tests found');
  });

  // The fixture's runnable tests all pass, so the per-status breakdown collected
  // without execution matches a real run exactly — including `.each` expansion,
  // skips, todos, xfail, focus, and `--testNamePattern` deselection.
  testOnCircus.each([
    ['unfiltered', [] as Array<string>],
    ['--testNamePattern', ['--testNamePattern=passes']],
  ])('reports the same counts as a real run (%s)', (_label, args) => {
    const real = JSON.parse(
      runJest('collect-tests', ['--json', ...args]).stdout,
    );
    const collected = JSON.parse(
      runJest('collect-tests', ['--collect-tests', '--json', ...args]).stdout,
    );

    expect(real.numFailedTests).toBe(0);
    expect(counts(collected)).toEqual(counts(real));
    expect(collected.numPassedTests).toBeGreaterThan(0);
    expect(collected.numPendingTests).toBeGreaterThan(0);
  });

  // Focus (`test.only`/`fdescribe`) deselects the other tests in the file. Both
  // runners must collect the same per-status counts a real run produces; the
  // focused fixture has no `test.failing`, so jasmine parity holds here too.
  test('reports the same counts as a real run with focused tests', () => {
    const real = JSON.parse(
      runJest('collect-tests', ['--json', '--testPathPatterns=focused']).stdout,
    );
    const collected = JSON.parse(
      runJest('collect-tests', [
        '--collect-tests',
        '--json',
        '--testPathPatterns=focused',
      ]).stdout,
    );

    expect(real.numFailedTests).toBe(0);
    expect(real.numPassedTests).toBe(1);
    expect(real.numPendingTests).toBeGreaterThan(0);
    expect(counts(collected)).toEqual(counts(real));
  });

  testOnCircus('marks xfail (test.failing) entries as failing', () => {
    const {stdout} = runJest('collect-tests', [
      '--collect-tests',
      '--json',
      '--testPathPatterns=kitchenSink',
    ]);
    const xfail = JSON.parse(stdout).testResults[0].assertionResults.find(
      (assertion: {title: string}) =>
        assertion.title === 'known broken passes when it throws',
    );
    expect(xfail.failing).toBe(true);
  });
});
