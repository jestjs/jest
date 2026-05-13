/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'node:path';
import runJest from '../runJest';

const dir = resolve(__dirname, '../browser-basic');

describe('browser error handling', () => {
  test('reports assertion failures', () => {
    const result = runJest(dir, ['failing.test.ts']);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('toBe assertion failed');
  });

  test('reports thrown errors with message', () => {
    const result = runJest(dir, ['failing.test.ts']);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('intentional error');
  });

  test('reports async rejections', () => {
    const result = runJest(dir, ['failing.test.ts']);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('async failure');
  });

  test('includes stack traces pointing to test file', () => {
    const result = runJest(dir, ['failing.test.ts']);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('failing.test.ts');
  });

  test('reports correct number of failures', () => {
    const result = runJest(dir, ['failing.test.ts']);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('3 failed');
  });
});
