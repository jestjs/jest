/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'node:path';
import runJest from '../runJest';

const dir = resolve(__dirname, '../browser-basic');

describe('browser test filtering', () => {
  test('--testNamePattern filters tests', () => {
    const result = runJest(dir, [
      'basic.test.ts',
      '--testNamePattern',
      'navigator',
    ]);
    expect(result.exitCode).toBe(0);
    // Should run only matching test, skip others
    expect(result.stderr).toContain('1 passed');
  });

  test('--testPathPatterns filters files', () => {
    const result = runJest(dir, ['--testPathPatterns', 'math']);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain('math.test.ts');
  });
});
