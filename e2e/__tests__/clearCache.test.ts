/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import * as fs from 'graceful-fs';
import runJest from '../runJest';

const CACHE = path.resolve(tmpdir(), 'clear-cache-directory');

describe('jest --clearCache', () => {
  test('normal run results in cache directory being written', () => {
    const {exitCode} = runJest('clear-cache', [`--cacheDirectory=${CACHE}`]);

    expect(fs.existsSync(CACHE)).toBe(true);
    expect(exitCode).toBe(0);
  });
  test('clearCache results in deleted directory and exitCode 0', () => {
    expect(fs.existsSync(CACHE)).toBe(true);

    const {exitCode, stdout, stderr} = runJest('clear-cache', [
      '--clearCache',
      `--cacheDirectory=${CACHE}`,
    ]);

    expect(fs.existsSync(CACHE)).toBe(false);
    expect(stdout).toBe(`Cleared ${CACHE}`);
    expect(stderr).toBe('');
    expect(exitCode).toBe(0);
  });
});
