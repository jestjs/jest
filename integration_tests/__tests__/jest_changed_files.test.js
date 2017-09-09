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

import os from 'os';
import path from 'path';
import {
  findRepos,
  getChangedFilesForRoots,
} from '../../packages/jest-changed-files/src';
const skipOnWindows = require('../../scripts/skip_on_windows');
const {cleanup, run, writeFiles} = require('../utils');

skipOnWindows.suite();

const DIR = path.resolve(os.tmpdir(), 'jest_changed_files_test_dir');

const GIT = 'git -c user.name=jest_test -c user.email=jest_test@test.com';
const HG = 'hg --config ui.username=jest_test';

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('gets hg SCM roots and dedups them', async () => {
  writeFiles(DIR, {
    'first_repo/file1.txt': 'file1',
    'first_repo/nested_dir/file2.txt': 'file2',
    'first_repo/nested_dir/second_nested_dir/file3.txt': 'file3',
    'second_repo/file1.txt': 'file1',
    'second_repo/nested_dir/file2.txt': 'file2',
    'second_repo/nested_dir/second_nested_dir/file3.txt': 'file3',
  });

  run(`${HG} init`, path.resolve(DIR, 'first_repo'));
  run(`${HG} init`, path.resolve(DIR, 'second_repo'));

  const roots = [
    '',
    'first_repo/nested_dir',
    'first_repo/nested_dir/second_nested_dir',
    'second_repo/nested_dir',
    'second_repo/nested_dir/second_nested_dir',
  ].map(filename => path.resolve(DIR, filename));

  const repos = await findRepos(roots);
  expect(repos.git.size).toBe(0);

  const hgRepos = Array.from(repos.hg);

  // it's not possible to match the exact path because it will resolve
  // differently on different platforms.
  // NOTE: This test can break if you have a .hg repo initialized inside your
  // os tmp directory.
  expect(hgRepos).toHaveLength(2);
  expect(hgRepos[0]).toMatch(/\/jest_changed_files_test_dir\/first_repo$/);
  expect(hgRepos[1]).toMatch(/\/jest_changed_files_test_dir\/second_repo$/);
});

test('gets git SCM roots and dedups them', async () => {
  writeFiles(DIR, {
    'first_repo/file1.txt': 'file1',
    'first_repo/nested_dir/file2.txt': 'file2',
    'first_repo/nested_dir/second_nested_dir/file3.txt': 'file3',
    'second_repo/file1.txt': 'file1',
    'second_repo/nested_dir/file2.txt': 'file2',
    'second_repo/nested_dir/second_nested_dir/file3.txt': 'file3',
  });

  run(`${GIT} init`, path.resolve(DIR, 'first_repo'));
  run(`${GIT} init`, path.resolve(DIR, 'second_repo'));

  const roots = [
    '',
    'first_repo/nested_dir',
    'first_repo/nested_dir/second_nested_dir',
    'second_repo/nested_dir',
    'second_repo/nested_dir/second_nested_dir',
  ].map(filename => path.resolve(DIR, filename));

  const repos = await findRepos(roots);
  expect(repos.hg.size).toBe(0);
  const gitRepos = Array.from(repos.git);

  // it's not possible to match the exact path because it will resolve
  // differently on different platforms.
  // NOTE: This test can break if you have a .git repo initialized inside your
  // os tmp directory.
  expect(gitRepos).toHaveLength(2);
  expect(gitRepos[0]).toMatch(/\/jest_changed_files_test_dir\/first_repo$/);
  expect(gitRepos[1]).toMatch(/\/jest_changed_files_test_dir\/second_repo$/);
});

test('gets mixed git and hg SCM roots and dedups them', async () => {
  writeFiles(DIR, {
    'first_repo/file1.txt': 'file1',
    'first_repo/nested_dir/file2.txt': 'file2',
    'first_repo/nested_dir/second_nested_dir/file3.txt': 'file3',
    'second_repo/file1.txt': 'file1',
    'second_repo/nested_dir/file2.txt': 'file2',
    'second_repo/nested_dir/second_nested_dir/file3.txt': 'file3',
  });

  run(`${GIT} init`, path.resolve(DIR, 'first_repo'));
  run(`${HG} init`, path.resolve(DIR, 'second_repo'));

  const roots = [
    '',
    'first_repo/nested_dir',
    'first_repo/nested_dir/second_nested_dir',
    'second_repo/nested_dir',
    'second_repo/nested_dir/second_nested_dir',
  ].map(filename => path.resolve(DIR, filename));

  const repos = await findRepos(roots);
  const hgRepos = Array.from(repos.hg);
  const gitRepos = Array.from(repos.git);

  // NOTE: This test can break if you have a .git  or .hg repo initialized
  // inside your os tmp directory.
  expect(gitRepos).toHaveLength(1);
  expect(hgRepos).toHaveLength(1);
  expect(gitRepos[0]).toMatch(/\/jest_changed_files_test_dir\/first_repo$/);
  expect(hgRepos[0]).toMatch(/\/jest_changed_files_test_dir\/second_repo$/);
});

test('gets changed files for git', async () => {
  writeFiles(DIR, {
    'file1.txt': 'file1',
    'nested_dir/file2.txt': 'file2',
    'nested_dir/second_nested_dir/file3.txt': 'file3',
  });

  run(`${GIT} init`, DIR);

  const roots = [
    '',
    'nested_dir',
    'nested_dir/second_nested_dir',
  ].map(filename => path.resolve(DIR, filename));

  let {changedFiles: files} = await getChangedFilesForRoots(roots, {});
  expect(
    Array.from(files)
      .map(filePath => path.basename(filePath))
      .sort(),
  ).toEqual(['file1.txt', 'file2.txt', 'file3.txt']);

  run(`${GIT} add .`, DIR);
  run(`${GIT} commit -m "test"`, DIR);

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {}));
  expect(Array.from(files)).toEqual([]);

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {
    lastCommit: true,
  }));
  expect(
    Array.from(files)
      .map(filePath => path.basename(filePath))
      .sort(),
  ).toEqual(['file1.txt', 'file2.txt', 'file3.txt']);

  writeFiles(DIR, {
    'file1.txt': 'modified file1',
  });

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {}));
  expect(
    Array.from(files)
      .map(filePath => path.basename(filePath))
      .sort(),
  ).toEqual(['file1.txt']);
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
    'file1.txt': 'file1',
    'nested_dir/file2.txt': 'file2',
    'nested_dir/second_nested_dir/file3.txt': 'file3',
  });

  run(`${HG} init`, DIR);

  const roots = [
    '',
    'nested_dir',
    'nested_dir/second_nested_dir',
  ].map(filename => path.resolve(DIR, filename));

  let {changedFiles: files} = await getChangedFilesForRoots(roots, {});
  expect(
    Array.from(files)
      .map(filePath => path.basename(filePath))
      .sort(),
  ).toEqual(['file1.txt', 'file2.txt', 'file3.txt']);

  run(`${HG} add .`, DIR);
  run(`${HG} commit -m "test"`, DIR);

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {}));
  expect(Array.from(files)).toEqual([]);

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {
    lastCommit: true,
  }));
  expect(
    Array.from(files)
      .map(filePath => path.basename(filePath))
      .sort(),
  ).toEqual(['file1.txt', 'file2.txt', 'file3.txt']);

  writeFiles(DIR, {
    'file1.txt': 'modified file1',
  });

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {}));
  expect(
    Array.from(files)
      .map(filePath => path.basename(filePath))
      .sort(),
  ).toEqual(['file1.txt']);

  run(`${HG} commit -m "test2"`, DIR);

  writeFiles(DIR, {
    'file4.txt': 'file4',
  });

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {
    withAncestor: true,
  }));
  // Returns files from current uncommited state + the last commit
  expect(
    Array.from(files)
      .map(filePath => path.basename(filePath))
      .sort(),
  ).toEqual(['file1.txt', 'file4.txt']);
});
