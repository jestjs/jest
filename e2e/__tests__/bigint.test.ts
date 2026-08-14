/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {FormattedTestResults} from '@jest/test-result';
import runJest from '../runJest';

it('reports bigint assertions without a serialization error', () => {
  const {exitCode, stderr} = runJest('bigint');

  expect(stderr).not.toContain('Do not know how to serialize a BigInt');
  expect(stderr).toContain('Expected: 10n');
  expect(stderr).toContain('Received: 4n');
  expect(stderr).toMatch(/1 failed, 1 passed/);
  expect(exitCode).toBe(1);
});

it('serializes bigint assertions to JSON', () => {
  const {exitCode, stdout} = runJest('bigint', [
    '--json',
    '--testPathPatterns=failing',
  ]);

  expect(exitCode).toBe(1);

  const jsonResult: FormattedTestResults = JSON.parse(stdout);

  expect(jsonResult.numFailedTests).toBe(1);
  expect(stdout).toContain('"actual":"4n"');
  expect(stdout).toContain('"expected":"10n"');
});
