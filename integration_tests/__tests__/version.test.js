/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const path = require('path');
const os = require('os');
const skipOnWindows = require('../../scripts/skip_on_windows');
const {cleanup, writeFiles} = require('../utils');
const runJest = require('../runJest');

const DIR = path.resolve(os.tmpdir(), 'version_test');

skipOnWindows.suite();

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('works with jest.conf.js', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    'package.json': '{}',
  });

  const {status, stdout, stderr} = runJest(DIR, ['--version']);
  expect(stdout).toMatch(/v\d{2}\.\d{1,2}\.\d{1,2}[\-\S]*\n$/);
  // Only version gets printed and nothing else
  expect(stdout.trim().split(/\n/)).toHaveLength(1);
  expect(stderr.trim()).toBe('');
  expect(status).toBe(0);
});
