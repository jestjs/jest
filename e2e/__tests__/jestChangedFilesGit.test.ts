/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { getChangedFilesForRoots } from 'jest-changed-files';
import { tmpdir } from 'os';
import * as path from 'path';
import runJest from '../runJest';
import { cleanup, run, writeFiles } from '../Utils';
import semver = require('semver');

const DIR = path.resolve(tmpdir(), 'jest-changed-files-test-dir');

const GIT = 'git -c user.name=jest_test -c user.email=jest_test@test.com';

const gitVersionSupportsInitialBranch = (() => {
  const {stdout} = run(`${GIT} --version`);
  const gitVersion = stdout.trim();

  const match = gitVersion.match(/^git version (?<version>\d+\.\d+\.\d+)/);

  if (match?.groups?.version == null) {
    throw new Error(`Unable to parse git version from string "${gitVersion}"`);
  }

  const {version} = match.groups;

  return semver.gte(version, '2.28.0');
})();

const mainBranchName = gitVersionSupportsInitialBranch ? 'main' : 'master';

function gitInit(dir: string) {
  const initCommand = gitVersionSupportsInitialBranch
    ? `${GIT} init --initial-branch=${mainBranchName}`
    : `${GIT} init`;

  run(initCommand, dir);
}

function gitCreateBranch(branchName: string, dir: string) {
  run(`git branch ${branchName}`, dir);
}

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));


test('gets changed files for git', async () => {
  writeFiles(DIR, {
    'file1.txt': 'file1',
    'nested-dir/file2.txt': 'file2',
    'nested-dir/second-nested-dir/file3.txt': 'file3',
  });

  gitInit(DIR);

  const roots = [
    // same first root name with existing branch name makes pitfall that
    // causes "ambiguous argument" git error.
    'nested-dir',
    'nested-dir/second-nested-dir',
    '',
  ].map(filename => path.resolve(DIR, filename));

  let {changedFiles: files} = await getChangedFilesForRoots(roots, {});
  expect(
    Array.from(files)
      .map(filePath => path.basename(filePath))
      .sort(),
  ).toEqual(['file1.txt', 'file2.txt', 'file3.txt']);

  run(`${GIT} add .`, DIR);

  // Uses multiple `-m` to make the commit message have multiple
  // paragraphs. This is done to ensure that `changedFiles` only
  // returns files and not parts of commit messages.
  run(`${GIT} commit --no-gpg-sign -m "test" -m "extra-line"`, DIR);

  gitCreateBranch('nested-dir', DIR);

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

  run(`${GIT} add -A`, DIR);

  // staged files should be included
  ({changedFiles: files} = await getChangedFilesForRoots(roots, {}));
  expect(
    Array.from(files)
      .map(filePath => path.basename(filePath))
      .sort(),
  ).toEqual(['file1.txt']);

  run(`${GIT} commit --no-gpg-sign -am "test2"`, DIR);

  writeFiles(DIR, {
    'file4.txt': 'file4',
  });

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {
    withAncestor: true,
  }));
  // Returns files from current uncommitted state + the last commit
  expect(
    Array.from(files)
      .map(filePath => path.basename(filePath))
      .sort(),
  ).toEqual(['file1.txt', 'file4.txt']);

  run(`${GIT} add file4.txt`, DIR);
  run(`${GIT} commit --no-gpg-sign -m "test3"`, DIR);

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {
    changedSince: 'HEAD^^',
  }));
  // Returns files from the last 2 commits
  expect(
    Array.from(files)
      .map(filePath => path.basename(filePath))
      .sort(),
  ).toEqual(['file1.txt', 'file4.txt']);

  run(`${GIT} checkout HEAD^^ -b feature-branch`, DIR);

  writeFiles(DIR, {
    'file5.txt': 'file5',
  });
  run(`${GIT} add file5.txt`, DIR);
  run(`${GIT} commit --no-gpg-sign -m "test5"`, DIR);

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {
    changedSince: mainBranchName,
  }));
  // Returns files from this branch but not ones that only exist on mainBranchName
  expect(
    Array.from(files)
      .map(filePath => path.basename(filePath))
      .sort(),
  ).toEqual(['file5.txt']);
});

test('monitors only root paths for git', async () => {
  writeFiles(DIR, {
    'file1.txt': 'file1',
    'nested-dir/file2.txt': 'file2',
    'nested-dir/second-nested-dir/file3.txt': 'file3',
  });

  gitInit(DIR);

  const roots = [path.resolve(DIR, 'nested-dir')];

  const {changedFiles: files} = await getChangedFilesForRoots(roots, {});
  expect(
    Array.from(files)
      .map(filePath => path.basename(filePath))
      .sort(),
  ).toEqual(['file2.txt', 'file3.txt']);
});

it('does not find changes in files with no diff, for git', async () => {
  const roots = [path.resolve(DIR)];

  // create an empty file, commit it to "mainBranchName"
  writeFiles(DIR, {'file1.txt': ''});
  gitInit(DIR);
  run(`${GIT} add file1.txt`, DIR);
  run(`${GIT} commit --no-gpg-sign -m "initial"`, DIR);

  // check out a new branch, jestChangedFilesSpecBase, to use later in diff
  run(`${GIT} checkout -b jestChangedFilesSpecBase`, DIR);

  // check out second branch, jestChangedFilesSpecMod, modify file & commit
  run(`${GIT} checkout -b jestChangedFilesSpecMod`, DIR);
  writeFiles(DIR, {
    'file1.txt': 'modified file1',
  });
  run(`${GIT} add file1.txt`, DIR);
  run(`${GIT} commit --no-gpg-sign -m "modified"`, DIR);

  // still on jestChangedFilesSpecMod branch, "revert" back to empty file and commit
  writeFiles(DIR, {
    'file1.txt': '',
  });
  run(`${GIT} add file1.txt`, DIR);
  run(`${GIT} commit --no-gpg-sign -m "removemod"`, DIR);

  // check that passing in no changedSince arg doesn't return any unstaged / other changes
  const {changedFiles: files} = await getChangedFilesForRoots(roots, {});
  expect(Array.from(files)).toEqual([]);

  // check that in diff from `jestChangedFilesSpecBase` branch, no changed files are reported
  const {changedFiles: filesExplicitBaseBranch} = await getChangedFilesForRoots(
    roots,
    {
      changedSince: 'jestChangedFilesSpecBase',
    },
  );
  expect(Array.from(filesExplicitBaseBranch)).toEqual([]);
});

test('handles a bad revision for "changedSince", for git', async () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '__tests__/file1.test.js': `require('../file1'); test('file1', () => {});`,
    'file1.js': 'module.exports = {}',
    'package.json': '{}',
  });

  gitInit(DIR);
  run(`${GIT} add .`, DIR);
  run(`${GIT} commit --no-gpg-sign -m "first"`, DIR);

  const {exitCode, stderr} = runJest(DIR, ['--changedSince=^blablabla']);

  expect(exitCode).toBe(1);
  expect(stderr).toContain('Test suite failed to run');
  expect(stderr).toContain("fatal: bad revision '^blablabla...HEAD'");
});
