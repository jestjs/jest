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

const DIR = path.resolve(os.tmpdir(), 'jest_only_changed');
const GIT = 'git -c user.name=jest_test -c user.email=jest_test@test.com';

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('run for "onlyChanged" and "changedSince"', () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '__tests__/file1.test.js': `require('../file1'); test('file1', () => {});`,
    'file1.js': 'module.exports = {}',
    'package.json': '{}',
  });

  run(`${GIT} init`, DIR);
  run(`${GIT} add .`, DIR);
  run(`${GIT} commit --no-gpg-sign -m "first"`, DIR);

  let stdout = runJest(DIR, ['-o']).stdout;
  expect(stdout).toMatch(
    /No tests found related to files changed since last commit./,
  );

  stdout = runJest(DIR, ['--changedSince=master']).stdout;
  expect(stdout).toMatch(
    /No tests found related to files changed since "master"./,
  );
});

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
  run(`${GIT} commit --no-gpg-sign -m "first"`, DIR);

  ({stdout} = runJest(DIR, ['-o']));
  expect(stdout).toMatch('No tests found related to files');

  ({stderr} = runJest(DIR, ['-o', '--lastCommit']));
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file1.test.js/);

  writeFiles(DIR, {
    '__tests__/file2.test.js': `require('../file2'); test('file2', () => {});`,
    '__tests__/file3.test.js': `require('../file3'); test('file3', () => {});`,
    'file2.js': 'module.exports = {}',
    'file3.js': `require('./file2')`,
  });

  ({stderr} = runJest(DIR, ['-o']));

  expect(stderr).not.toMatch(/PASS __tests__(\/|\\)file1.test.js/);
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file2.test.js/);
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file3.test.js/);

  run(`${GIT} add .`, DIR);
  run(`${GIT} commit --no-gpg-sign -m "second"`, DIR);

  ({stderr} = runJest(DIR, ['-o']));
  expect(stdout).toMatch('No tests found related to files');

  writeFiles(DIR, {
    'file2.js': 'module.exports = {modified: true}',
  });

  ({stderr} = runJest(DIR, ['-o']));
  expect(stderr).not.toMatch(/PASS __tests__(\/|\\)file1.test.j/);
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file2.test.js/);
  expect(stderr).toMatch(/PASS __tests__(\/|\\)file3.test.js/);
});

test('report test coverage for only changed files', () => {
  writeFiles(DIR, {
    '__tests__/a.test.js': `
    require('../a');
    require('../b');
    test('a', () => expect(1).toBe(1));
  `,
    '__tests__/b.test.js': `
    require('../b');
    test('b', () => expect(1).toBe(1));
  `,
    'a.js': 'module.exports = {}',
    'b.js': 'module.exports = {}',
    'package.json': JSON.stringify({
      jest: {
        collectCoverage: true,
        coverageReporters: ['text'],
        testEnvironment: 'node',
      },
    }),
  });

  run(`${GIT} init`, DIR);
  run(`${GIT} add .`, DIR);
  run(`${GIT} commit --no-gpg-sign -m "first"`, DIR);

  writeFiles(DIR, {
    'a.js': 'module.exports = {modified: true}',
  });

  let stdout;

  ({stdout} = runJest(DIR));

  // both a.js and b.js should be in the coverage
  expect(stdout).toMatch('a.js');
  expect(stdout).toMatch('b.js');

  ({stdout} = runJest(DIR, ['-o']));

  // coverage should be collected only for a.js
  expect(stdout).toMatch('a.js');
  expect(stdout).not.toMatch('b.js');
});
