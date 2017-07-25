/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

import runJest from '../runJest';
import {cleanup, writeFiles} from '../utils';
import os from 'os';
import path from 'path';

const skipOnWindows = require('../../scripts/skip_on_windows');
const DIR = path.resolve(os.tmpdir(), 'use_stderr_test');

skipOnWindows.suite();

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('no tests found message is redirected to stderr', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    'file1.js': 'module.exports = {}',
    'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
  });
  let stderr;
  let stdout;

  ({stdout, stderr} = runJest(DIR, ['--useStderr']));
  expect(stdout.trim()).toBe('');
  expect(stderr).toMatch('No tests found');

  writeFiles(DIR, {
    '__tests__/test.test.js': `require('../file1'); test('file1', () => {});`,
  });

  ({stdout, stderr} = runJest(DIR, ['--useStderr']));
  expect(stdout.trim()).toBe('');
  expect(stderr).toMatch(/PASS.*test\.test\.js/);
});
