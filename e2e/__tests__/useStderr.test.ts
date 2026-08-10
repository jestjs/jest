/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import {cleanup, writeFiles} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(tmpdir(), 'use-stderr-test');

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
  expect(stdout).toBe('');
  expect(stderr).toMatch('No tests found');

  writeFiles(DIR, {
    '__tests__/test.test.js': "require('../file1'); test('file1', () => {});",
  });

  ({stdout, stderr} = runJest(DIR, ['--useStderr']));
  expect(stdout).toBe('');
  expect(stderr).toMatch(/PASS.*test\.test\.js/);
});
