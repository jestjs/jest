/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const runJest = require('../runJest');
const skipOnWindows = require('../../scripts/skip_on_windows');
const rimraf = require('rimraf');

const CACHE = path.resolve(os.tmpdir(), 'clear_cache_directory');

skipOnWindows.suite();

describe('jest --clearCache', () => {
  test('normal run results in cache directory being written', () => {
    const {status} = runJest('clear_cache', [`--cacheDirectory=${CACHE}`]);

    expect(fs.existsSync(CACHE)).toBe(true);
    expect(status).toBe(0);
  });
  test('clearCache results in deleted directory and exit status 0', () => {
    const {status, stdout, stderr} = runJest('clear_cache', [
      '--clearCache',
      `--cacheDirectory=${CACHE}`,
    ]);

    expect(fs.existsSync(CACHE)).toBe(false);
    expect(stdout).toBe(`Cleared ${CACHE}\n`);
    expect(stderr.trim()).toBe('');
    expect(status).toBe(0);
  });
});
