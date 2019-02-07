/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import runJest from '../runJest';
import os from 'os';
import path from 'path';
import {cleanup, run, writeFiles} from '../Utils';

const DIR = path.resolve(os.tmpdir(), 'jest_only_changed2');
const GIT = 'git -c user.name=jest_test -c user.email=jest_test@test.com';
const HG = 'hg --config ui.username=jest_test';

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('onlyChanged in config is overwritten by --all or testPathPattern', () => {
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
  run(`${GIT} commit --no-gpg-sign -m "first"`, DIR);

  ({stdout, stderr} = runJest(DIR));
  expect(stdout).toMatch('No tests found related to files');
  expect(stderr).not.toMatch(
    'Unknown option "onlyChanged" with value true was found',
  );

  ({stderr} = runJest(DIR, ['--lastCommit']));
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file1.test.js/);

  writeFiles(DIR, {
    '__tests__/file2.test.js': `require('../file2'); test('file2', () => {});`,
    '__tests__/file3.test.js': `require('../file3'); test('file3', () => {});`,
    'file2.js': 'module.exports = {}',
    'file3.js': `require('./file2')`,
  });

  ({stderr} = runJest(DIR));

  expect(stderr).not.toMatch(/PASS __tests__(\/|\\)file1.test.js/);
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file2.test.js/);
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file3.test.js/);

  run(`${GIT} add .`, DIR);
  run(`${GIT} commit --no-gpg-sign -m "second"`, DIR);

  ({stderr} = runJest(DIR));
  expect(stdout).toMatch('No tests found related to files');

  ({stderr, stdout} = runJest(DIR, ['file2.test.js']));
  expect(stdout).not.toMatch('No tests found related to files');
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file2.test.js/);
  expect(stderr).toMatch('1 total');

  writeFiles(DIR, {
    'file2.js': 'module.exports = {modified: true}',
  });

  ({stderr} = runJest(DIR));
  expect(stderr).not.toMatch(/PASS __tests__(\/|\\)file1.test.js/);
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file2.test.js/);
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file3.test.js/);

  ({stderr} = runJest(DIR, ['--all']));
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file1.test.js/);
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file2.test.js/);
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file3.test.js/);
});

test('gets changed files for hg', async () => {
  if (process.env.CI) {
    // Circle and Travis have very old version of hg (v2, and current
    // version is v4.2) and its API changed since then and not compatible
    // any more. Changing the SCM version on CIs is not trivial, so we'll just
    // skip this test and run it only locally.
    return;
  }
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '__tests__/file1.test.js': `require('../file1'); test('file1', () => {});`,
    'file1.js': 'module.exports = {}',
    'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
  });

  run(`${HG} init`, DIR);
  run(`${HG} add .`, DIR);
  run(`${HG} commit -m "test"`, DIR);

  let stdout;
  let stderr;

  ({stdout, stderr} = runJest(DIR, ['-o']));
  expect(stdout).toMatch('No tests found related to files changed');

  writeFiles(DIR, {
    '__tests__/file2.test.js': `require('../file2'); test('file2', () => {});`,
    'file2.js': 'module.exports = {}',
    'file3.js': `require('./file2')`,
  });

  ({stdout, stderr} = runJest(DIR, ['-o']));
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file2.test.js/);

  run(`${HG} add .`, DIR);
  run(`${HG} commit -m "test2"`, DIR);

  writeFiles(DIR, {
    '__tests__/file3.test.js': `require('../file3'); test('file3', () => {});`,
  });

  ({stdout, stderr} = runJest(DIR, ['-o']));
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file3.test.js/);
  expect(stderr).not.toMatch(/PASS __tests__(\/|\\)file2.test.js/);

  ({stdout, stderr} = runJest(DIR, ['-o', '--changedFilesWithAncestor']));
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file2.test.js/);
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file3.test.js/);
});

test('path on Windows is case-insensitive', () => {
  if (process.platform !== 'win32') {
    // This test is Windows specific, skip it on other platforms.
    return;
  }

  const modifiedDIR = path.resolve(DIR, 'outer_dir', 'inner_dir');
  const incorrectModifiedDIR = path.resolve(DIR, 'OUTER_dir', 'inner_dir');

  writeFiles(modifiedDIR, {
    '.watchmanconfig': '',
    '__tests__/file1.test.js': `require('../file1'); test('file1', () => {});`,
    'file1.js': 'module.exports = {}',
    'package.json': '{}',
  });

  run(`${GIT} init`, modifiedDIR);
  run(`${GIT} add .`, modifiedDIR);
  run(`${GIT} commit --no-gpg-sign -m "first"`, modifiedDIR);

  const {stdout} = runJest(incorrectModifiedDIR, ['-o']);
  expect(stdout).toMatch('No tests found related to files');

  writeFiles(modifiedDIR, {
    '__tests__/file2.test.js': `require('../file2'); test('file2', () => {});`,
    '__tests__/file3.test.js': `require('../file3'); test('file3', () => {});`,
    'file2.js': 'module.exports = {}',
    'file3.js': `require('./file2')`,
  });

  const {stderr} = runJest(incorrectModifiedDIR, ['-o']);

  expect(stderr).not.toMatch(/PASS __tests__(\/|\\)file1.test.js/);
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file2.test.js/);
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file3.test.js/);
});
