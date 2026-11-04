/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

const fixture = 'unused-stubs';

const warning = 'unused stub';

test('reports unused stubs when opted in through a docblock pragma', () => {
  const {stderr, stdout, exitCode} = runJest(
    fixture,
    ['--no-cache', 'withPragma'],
    {stripAnsi: true},
  );

  expect(exitCode).toBe(0);
  expect(stderr).toContain(`Warning: 1 ${warning} detected in this test file`);
  expect(stderr).toContain('- multiply');
  expect(stderr).not.toContain('- add');
  expect(stdout).not.toContain(warning);
});

test('does not report unused stubs without the docblock pragma', () => {
  const {stderr, stdout, exitCode} = runJest(
    fixture,
    ['--no-cache', 'withoutPragma'],
    {stripAnsi: true},
  );

  expect(exitCode).toBe(0);
  expect(stderr).not.toContain(warning);
  expect(stdout).not.toContain(warning);
});

test('does not report stubs that were all used', () => {
  const {stderr, stdout, exitCode} = runJest(
    fixture,
    ['--no-cache', 'allStubsUsed'],
    {stripAnsi: true},
  );

  expect(exitCode).toBe(0);
  expect(stderr).not.toContain(warning);
  expect(stdout).not.toContain(warning);
});
