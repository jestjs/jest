/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'node:path';
import runJest from '../runJest';

const dir = resolve(__dirname, '../browser-mixed-projects');

test('runs jsdom unit tests alongside browser tests', () => {
  const result = runJest(dir);
  expect(result.exitCode).toBe(0);
  // Verify both projects ran (4 suites: 2 unit + 2 browser)
  expect(result.stderr).toContain('4 passed');
});

test('unit tests pass in jsdom environment', () => {
  const result = runJest(dir, ['--selectProjects', 'unit']);
  expect(result.exitCode).toBe(0);
});

test('browser tests pass in real browser', () => {
  const result = runJest(dir, ['--selectProjects', 'browser']);
  expect(result.exitCode).toBe(0);
});
