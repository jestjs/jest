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
const {cleanup, writeFiles} = require('../utils');
const runJest = require('../runJest');
const skipOnWindows = require('../../scripts/skip_on_windows');

const CACHE = path.resolve(os.tmpdir(), 'clear_cache_directory');
const DIR = path.resolve(os.tmpdir(), 'clear_cache');

skipOnWindows.suite();

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

describe('jest --clearCache', () => {
  test('clearing cache results in exit status 0', () => {
    writeFiles(DIR, {
      '.watchmanconfig': '',
      'package.json': '{}',
    });

    const {status, stdout, stderr} = runJest(DIR, [
      '--clearCache',
      `--cacheDirectory=${CACHE}`,
    ]);

    expect(fs.existsSync(CACHE)).toBe(false);
    expect(stdout).toBe(`Cleared ${CACHE}\n`);
    expect(stderr.trim()).toBe('');
    expect(status).toBe(0);
  });
});
