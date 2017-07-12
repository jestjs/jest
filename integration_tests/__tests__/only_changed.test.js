/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

import runJest from '../runJest';
import {cleanup, run, writeFiles} from '../utils';
import os from 'os';
import path from 'path';

const skipOnWindows = require('skipOnWindows');
const DIR = path.resolve(os.tmpdir(), 'jest_only_changed');
const GIT = 'git -c user.name=jest_test -c user.email=jest_test@test.com';

skipOnWindows.suite();

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('run only changed files', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '__tests__/file1.test.js': `require('../file1'); test('file1', () => {});`,
    'file1.js': 'module.exports = {}',
    'package.json': '{}',
  });
  let stderr;
  let stdout;

  ({stdout} = runJest(DIR, ['-o']));
  expect(stdout).toMatch(/Jest can only find uncommitted changed files/);

  run(`${GIT} init`, DIR);
  run(`${GIT} add .`, DIR);
  run(`${GIT} commit -m "first"`, DIR);

  ({stdout} = runJest(DIR, ['-o']));
  expect(stdout).toMatch('No tests found related to files');

  ({stderr} = runJest(DIR, ['-o', '--lastCommit']));
  expect(stderr).toMatch('PASS  __tests__/file1.test.js');

  writeFiles(DIR, {
    '__tests__/file2.test.js': `require('../file2'); test('file2', () => {});`,
    '__tests__/file3.test.js': `require('../file3'); test('file3', () => {});`,
    'file2.js': 'module.exports = {}',
    'file3.js': `require('./file2')`,
  });

  ({stderr} = runJest(DIR, ['-o']));

  expect(stderr).not.toMatch('PASS  __tests__/file1.test.js');
  expect(stderr).toMatch('PASS  __tests__/file2.test.js');
  expect(stderr).toMatch('PASS  __tests__/file3.test.js');

  run(`${GIT} add .`, DIR);
  run(`${GIT} commit -m "second"`, DIR);

  ({stderr} = runJest(DIR, ['-o']));
  expect(stdout).toMatch('No tests found related to files');

  writeFiles(DIR, {
    'file2.js': 'module.exports = {modified: true}',
  });

  ({stderr} = runJest(DIR, ['-o']));
  expect(stderr).not.toMatch('PASS  __tests__/file1.test.js');
  expect(stderr).toMatch('PASS  __tests__/file2.test.js');
  expect(stderr).toMatch('PASS  __tests__/file3.test.js');
});

test('onlyChanged in config is overwritten by --all', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '__tests__/file1.test.js': `require('../file1'); test('file1', () => {});`,
    'file1.js': 'module.exports = {}',
    'package.json': JSON.stringify({jest: {onlyChanged: true}}),
  });
  let stderr;
  let stdout;

  ({stdout} = runJest(DIR));
  expect(stdout).toMatch(/Jest can only find uncommitted changed files/);

  run(`${GIT} init`, DIR);
  run(`${GIT} add .`, DIR);
  run(`${GIT} commit -m "first"`, DIR);

  ({stdout, stderr} = runJest(DIR));
  expect(stdout).toMatch('No tests found related to files');
  expect(stderr).not.toMatch(
    'Unknown option "onlyChanged" with value true was found',
  );

  ({stderr} = runJest(DIR, ['--lastCommit']));
  expect(stderr).toMatch('PASS  __tests__/file1.test.js');

  writeFiles(DIR, {
    '__tests__/file2.test.js': `require('../file2'); test('file2', () => {});`,
    '__tests__/file3.test.js': `require('../file3'); test('file3', () => {});`,
    'file2.js': 'module.exports = {}',
    'file3.js': `require('./file2')`,
  });

  ({stderr} = runJest(DIR));

  expect(stderr).not.toMatch('PASS  __tests__/file1.test.js');
  expect(stderr).toMatch('PASS  __tests__/file2.test.js');
  expect(stderr).toMatch('PASS  __tests__/file3.test.js');

  run(`${GIT} add .`, DIR);
  run(`${GIT} commit -m "second"`, DIR);

  ({stderr} = runJest(DIR));
  expect(stdout).toMatch('No tests found related to files');

  writeFiles(DIR, {
    'file2.js': 'module.exports = {modified: true}',
  });

  ({stderr} = runJest(DIR));
  expect(stderr).not.toMatch('PASS  __tests__/file1.test.js');
  expect(stderr).toMatch('PASS  __tests__/file2.test.js');
  expect(stderr).toMatch('PASS  __tests__/file3.test.js');

  ({stderr} = runJest(DIR, ['--all']));
  expect(stderr).toMatch('PASS  __tests__/file1.test.js');
  expect(stderr).toMatch('PASS  __tests__/file2.test.js');
  expect(stderr).toMatch('PASS  __tests__/file3.test.js');
});
