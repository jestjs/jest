/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

type Counts = {
  numFailedTests: number;
  numPassedTests: number;
  numPendingTests: number;
  numTodoTests: number;
  numTotalTestSuites: number;
  numTotalTests: number;
};

const counts = (result: Counts): Counts => ({
  numFailedTests: result.numFailedTests,
  numPassedTests: result.numPassedTests,
  numPendingTests: result.numPendingTests,
  numTodoTests: result.numTodoTests,
  numTotalTestSuites: result.numTotalTestSuites,
  numTotalTests: result.numTotalTests,
});

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

  test('expands it.each / test.each into one entry per case', () => {
    const {exitCode, stdout} = runJest('each', [
      '--collect-tests',
      '--json',
      '--testPathPatterns=success',
    ]);

    expect(exitCode).toBe(0);
    const json = JSON.parse(stdout);
    const titles = json.testResults[0].assertionResults.map(
      (assertion: {title: string}) => assertion.title,
    );

    // The three-element `test.each(['red', 'green', 'bean'])` becomes three
    // separate collected entries rather than a single `.each` block.
    expect(titles).toContain("The word red contains the letter 'e'");
    expect(titles).toContain("The word green contains the letter 'e'");
    expect(titles).toContain("The word bean contains the letter 'e'");
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
    expect(json.numTotalTests).toBeGreaterThan(0);

    const testFile = json.testResults[0];
    expect(testFile.name).toContain('success.test.js');
    // Every test in this fixture would run, so all collect to `passed` and are
    // flagged `wouldRun` (selected, but never executed).
    for (const assertion of testFile.assertionResults) {
      expect(assertion.status).toBe('passed');
      expect(assertion.wouldRun).toBe(true);
    }
  });

  test('prints a summary line with the total count', () => {
    const {exitCode, stdout} = runJest('each', [
      '--collect-tests',
      '--testPathPatterns=success',
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/Test suites:\s+1/);
    expect(stdout).toMatch(/Tests:\s+15 total/);
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

  test('reports --testNamePattern-deselected tests as pending (like a real run)', () => {
    const {exitCode, stdout} = runJest('each', [
      '--collect-tests',
      '--json',
      '--testPathPatterns=success',
      '--testNamePattern=one row',
    ]);

    expect(exitCode).toBe(0);
    const json = JSON.parse(stdout);
    const byTitle = new Map<string, {status: string; wouldRun?: boolean}>(
      json.testResults[0].assertionResults.map(
        (assertion: {status: string; title: string; wouldRun?: boolean}) => [
          assertion.title,
          assertion,
        ],
      ),
    );

    // Matching tests would run; non-matching ones are still collected, but as
    // pending — exactly how an actual run accounts for them.
    expect(byTitle.get('passes one row expected true == true')).toMatchObject({
      status: 'passed',
      wouldRun: true,
    });
    expect(byTitle.get("The word red contains the letter 'e'")?.status).toBe(
      'pending',
    );
  });

  test('exits 0 even when no tests match', () => {
    const {exitCode, stdout} = runJest('each', [
      '--collect-tests',
      '--testPathPatterns=nonexistent',
    ]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('No tests found');
  });

  // Focus (`.only`) and `test.failing` collection parity is only implemented for
  // the default circus runner; jasmine2 collection support is best-effort.
  const testOnCircus = process.env.JEST_JASMINE ? test.skip : test;

  testOnCircus(
    'reports the same per-status counts as a real run (skip/todo/xfail/each/focus)',
    () => {
      const runReal = runJest('collect-tests', ['--json']);
      const runCollect = runJest('collect-tests', [
        '--collect-tests',
        '--json',
      ]);

      expect(runCollect.exitCode).toBe(0);
      const real = JSON.parse(runReal.stdout);
      const collected = JSON.parse(runCollect.stdout);

      // The real run passes (every runnable test is written to pass), so the
      // full per-status breakdown collected without execution matches it
      // exactly.
      expect(real.numFailedTests).toBe(0);
      expect(counts(collected)).toEqual(counts(real));

      // Sanity-check the breakdown is non-trivial: skips, todos and `.each`
      // expansion are all represented.
      expect(collected.numPendingTests).toBeGreaterThan(0);
      expect(collected.numTodoTests).toBeGreaterThan(0);
      expect(collected.numPassedTests).toBeGreaterThan(50);
    },
  );

  testOnCircus('matches a real run when filtered by --testNamePattern', () => {
    const args = ['--testNamePattern=passes'];
    const real = JSON.parse(
      runJest('collect-tests', ['--json', ...args]).stdout,
    );
    const collected = JSON.parse(
      runJest('collect-tests', ['--collect-tests', '--json', ...args]).stdout,
    );

    // Deselected tests are counted as pending by both, so the totals agree.
    expect(real.numFailedTests).toBe(0);
    expect(counts(collected)).toEqual(counts(real));
    expect(collected.numPendingTests).toBeGreaterThan(0);
    expect(collected.numPassedTests).toBeGreaterThan(0);
  });

  testOnCircus('marks xfail (test.failing) entries as failing', () => {
    const {exitCode, stdout} = runJest('collect-tests', [
      '--collect-tests',
      '--json',
      '--testPathPatterns=kitchenSink',
    ]);

    expect(exitCode).toBe(0);
    const json = JSON.parse(stdout);
    const xfail = json.testResults[0].assertionResults.find(
      (assertion: {title: string}) =>
        assertion.title === 'known broken passes when it throws',
    );
    expect(xfail).toBeDefined();
    expect(xfail.failing).toBe(true);
  });
});
