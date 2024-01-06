/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import * as fs from 'graceful-fs';
import semver = require('semver');
import slash = require('slash');
import {findRepos, getChangedFilesForRoots} from 'jest-changed-files';
import {
  cleanup,
  run,
  testIfHg,
  testIfSl,
  testIfSlAndHg,
  writeFiles,
} from '../Utils';
import runJest from '../runJest';

const DIR = path.resolve(tmpdir(), 'jest-changed-files-test-dir');

const GIT = 'git -c user.name=jest_test -c user.email=jest_test@test.com';
const HG = 'hg --config ui.username=jest_test';
const SL = 'sl --config ui.username=jest_test';

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

jest.retryTimes(3);

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

testIfHg('gets hg SCM roots and dedupes them', async () => {
  writeFiles(DIR, {
    'first-repo/file1.txt': 'file1',
    'first-repo/nested-dir/file2.txt': 'file2',
    'first-repo/nested-dir/second-nested-dir/file3.txt': 'file3',
    'second-repo/file1.txt': 'file1',
    'second-repo/nested-dir/file2.txt': 'file2',
    'second-repo/nested-dir/second-nested-dir/file3.txt': 'file3',
  });

  run(`${HG} init`, path.resolve(DIR, 'first-repo'));
  run(`${HG} init`, path.resolve(DIR, 'second-repo'));

  const roots = [
    '',
    'first-repo/nested-dir',
    'first-repo/nested-dir/second-nested-dir',
    'second-repo/nested-dir',
    'second-repo/nested-dir/second-nested-dir',
  ].map(filename => path.resolve(DIR, filename));

  const repos = await findRepos(roots);
  expect(repos.git.size).toBe(0);

  const hgRepos = [...repos.hg];

  // it's not possible to match the exact path because it will resolve
  // differently on different platforms.
  // NOTE: This test can break if you have a .hg repo initialized inside your
  // os tmp directory.
  expect(hgRepos).toHaveLength(2);
  expect(slash(hgRepos[0])).toMatch(
    /\/jest-changed-files-test-dir\/first-repo\/?$/,
  );
  expect(slash(hgRepos[1])).toMatch(
    /\/jest-changed-files-test-dir\/second-repo\/?$/,
  );
});

test('gets git SCM roots and dedupes them', async () => {
  writeFiles(DIR, {
    'first-repo/file1.txt': 'file1',
    'first-repo/nested-dir/file2.txt': 'file2',
    'first-repo/nested-dir/second-nested-dir/file3.txt': 'file3',
    'second-repo/file1.txt': 'file1',
    'second-repo/nested-dir/file2.txt': 'file2',
    'second-repo/nested-dir/second-nested-dir/file3.txt': 'file3',
  });

  gitInit(path.resolve(DIR, 'first-repo'));
  gitInit(path.resolve(DIR, 'second-repo'));

  const roots = [
    '',
    'first-repo/nested-dir',
    'first-repo/nested-dir/second-nested-dir',
    'second-repo/nested-dir',
    'second-repo/nested-dir/second-nested-dir',
  ].map(filename => path.resolve(DIR, filename));

  const repos = await findRepos(roots);
  expect(repos.hg.size).toBe(0);
  const gitRepos = [...repos.git];

  // it's not possible to match the exact path because it will resolve
  // differently on different platforms.
  // NOTE: This test can break if you have a .git repo initialized inside your
  // os tmp directory.
  expect(gitRepos).toHaveLength(2);
  expect(slash(gitRepos[0])).toMatch(
    /\/jest-changed-files-test-dir\/first-repo\/?$/,
  );
  expect(slash(gitRepos[1])).toMatch(
    /\/jest-changed-files-test-dir\/second-repo\/?$/,
  );
});

testIfSlAndHg(
  'gets mixed git, hg, and sl SCM roots and dedupes them',
  async () => {
    writeFiles(DIR, {
      'first-repo/file1.txt': 'file1',
      'first-repo/nested-dir/file2.txt': 'file2',
      'first-repo/nested-dir/second-nested-dir/file3.txt': 'file3',
      'second-repo/file1.txt': 'file1',
      'second-repo/nested-dir/file2.txt': 'file2',
      'second-repo/nested-dir/second-nested-dir/file3.txt': 'file3',
      'third-repo/file1.txt': 'file1',
      'third-repo/nested-dir/file2.txt': 'file2',
      'third-repo/nested-dir/second-nested-dir/file3.txt': 'file3',
    });

    gitInit(path.resolve(DIR, 'first-repo'));
    run(`${HG} init`, path.resolve(DIR, 'second-repo'));
    run(`${SL} init --git`, path.resolve(DIR, 'third-repo'));

    const roots = [
      '',
      'first-repo/nested-dir',
      'first-repo/nested-dir/second-nested-dir',
      'second-repo/nested-dir',
      'second-repo/nested-dir/second-nested-dir',
      'third-repo/nested-dir',
      'third-repo/nested-dir/second-nested-dir',
    ].map(filename => path.resolve(DIR, filename));

    const repos = await findRepos(roots);
    const hgRepos = [...repos.hg];
    const gitRepos = [...repos.git];
    const slRepos = [...repos.sl];

    // NOTE: This test can break if you have a .git  or .hg repo initialized
    // inside your os tmp directory.
    expect(gitRepos).toHaveLength(1);
    expect(hgRepos).toHaveLength(1);
    expect(slRepos).toHaveLength(1);
    expect(slash(gitRepos[0])).toMatch(
      /\/jest-changed-files-test-dir\/first-repo\/?$/,
    );
    expect(slash(hgRepos[0])).toMatch(
      /\/jest-changed-files-test-dir\/second-repo\/?$/,
    );
    expect(slash(slRepos[0])).toMatch(
      /\/jest-changed-files-test-dir\/third-repo\/?$/,
    );
  },
);

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
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file1.txt',
    'file2.txt',
    'file3.txt',
  ]);

  run(`${GIT} add .`, DIR);

  // Uses multiple `-m` to make the commit message have multiple
  // paragraphs. This is done to ensure that `changedFiles` only
  // returns files and not parts of commit messages.
  run(`${GIT} commit --no-gpg-sign -m "test" -m "extra-line"`, DIR);

  gitCreateBranch('nested-dir', DIR);

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {}));
  expect([...files]).toEqual([]);

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {
    lastCommit: true,
  }));
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file1.txt',
    'file2.txt',
    'file3.txt',
  ]);

  writeFiles(DIR, {
    'file1.txt': 'modified file1',
  });

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {}));
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file1.txt',
  ]);

  run(`${GIT} add -A`, DIR);

  // staged files should be included
  ({changedFiles: files} = await getChangedFilesForRoots(roots, {}));
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file1.txt',
  ]);

  run(`${GIT} commit --no-gpg-sign -am "test2"`, DIR);

  writeFiles(DIR, {
    'file4.txt': 'file4',
  });

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {
    withAncestor: true,
  }));
  // Returns files from current uncommitted state + the last commit
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file1.txt',
    'file4.txt',
  ]);

  run(`${GIT} add file4.txt`, DIR);
  run(`${GIT} commit --no-gpg-sign -m "test3"`, DIR);

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {
    changedSince: 'HEAD^^',
  }));
  // Returns files from the last 2 commits
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file1.txt',
    'file4.txt',
  ]);

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
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file5.txt',
  ]);
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
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file2.txt',
    'file3.txt',
  ]);
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
  expect([...files]).toEqual([]);

  // check that in diff from `jestChangedFilesSpecBase` branch, no changed files are reported
  const {changedFiles: filesExplicitBaseBranch} = await getChangedFilesForRoots(
    roots,
    {
      changedSince: 'jestChangedFilesSpecBase',
    },
  );
  expect([...filesExplicitBaseBranch]).toEqual([]);
});

test('handles a bad revision for "changedSince", for git', async () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '__tests__/file1.test.js': "require('../file1'); test('file1', () => {});",
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

testIfHg('gets changed files for hg', async () => {
  // file1.txt is used to make a multi-line commit message
  // with `hg commit -l file1.txt`.
  // This is done to ensure that `changedFiles` only returns files
  // and not parts of commit messages.
  writeFiles(DIR, {
    'file1.txt': 'file1\n\nextra-line',
    'nested-dir/file2.txt': 'file2',
    'nested-dir/second-nested-dir/file3.txt': 'file3',
  });

  run(`${HG} init`, DIR);

  const roots = ['', 'nested-dir', 'nested-dir/second-nested-dir'].map(
    filename => path.resolve(DIR, filename),
  );

  let {changedFiles: files} = await getChangedFilesForRoots(roots, {});
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file1.txt',
    'file2.txt',
    'file3.txt',
  ]);

  run(`${HG} add .`, DIR);
  run(`${HG} commit -l file1.txt`, DIR);

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {}));
  expect([...files]).toEqual([]);

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {
    lastCommit: true,
  }));
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file1.txt',
    'file2.txt',
    'file3.txt',
  ]);

  writeFiles(DIR, {
    'file1.txt': 'modified file1',
  });

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {}));
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file1.txt',
  ]);

  run(`${HG} commit -m "test2"`, DIR);

  writeFiles(DIR, {
    'file4.txt': 'file4',
  });

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {
    withAncestor: true,
  }));
  // Returns files from current uncommitted state + the last commit
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file1.txt',
    'file4.txt',
  ]);

  run(`${HG} add file4.txt`, DIR);
  run(`${HG} commit -m "test3"`, DIR);

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {
    changedSince: '-3',
  }));
  // Returns files from the last 2 commits
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file1.txt',
    'file4.txt',
  ]);

  run(`${HG} bookmark main`, DIR);
  // Back up and develop on a different branch
  run(`${HG} checkout --rev=-2`, DIR);

  writeFiles(DIR, {
    'file5.txt': 'file5',
  });
  run(`${HG} add file5.txt`, DIR);
  run(`${HG} commit -m "test4"`, DIR);

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {
    changedSince: 'main',
  }));
  // Returns files from this branch but not ones that only exist on main
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file5.txt',
  ]);
});

testIfHg('monitors only root paths for hg', async () => {
  writeFiles(DIR, {
    'file1.txt': 'file1',
    'nested-dir/file2.txt': 'file2',
    'nested-dir/second-nested-dir/file3.txt': 'file3',
  });

  run(`${HG} init`, DIR);

  const roots = [path.resolve(DIR, 'nested-dir')];

  const {changedFiles: files} = await getChangedFilesForRoots(roots, {});
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file2.txt',
    'file3.txt',
  ]);
});

testIfHg('handles a bad revision for "changedSince", for hg', async () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '__tests__/file1.test.js': "require('../file1'); test('file1', () => {});",
    'file1.js': 'module.exports = {}',
    'package.json': '{}',
  });

  run(`${HG} init`, DIR);
  run(`${HG} add .`, DIR);
  run(`${HG} commit -m "first"`, DIR);

  const {exitCode, stderr} = runJest(DIR, ['--changedSince=blablabla']);

  expect(exitCode).toBe(1);
  expect(stderr).toContain('Test suite failed to run');
  expect(stderr).toContain("abort: unknown revision 'blablabla'");
});

testIfSl('gets sl SCM roots and dedupes them', async () => {
  fs.mkdirSync(path.resolve(DIR, 'first-repo'), {recursive: true});
  writeFiles(DIR, {
    'first-repo/file1.txt': 'file1',
    'first-repo/nested-dir/file2.txt': 'file2',
    'first-repo/nested-dir/second-nested-dir/file3.txt': 'file3',
    'second-repo/file1.txt': 'file1',
    'second-repo/nested-dir/file2.txt': 'file2',
    'second-repo/nested-dir/second-nested-dir/file3.txt': 'file3',
  });

  run(`${SL} init --git`, path.resolve(DIR, 'first-repo'));
  run(`${SL} init --git`, path.resolve(DIR, 'second-repo'));

  const roots = [
    '',
    'first-repo/nested-dir',
    'first-repo/nested-dir/second-nested-dir',
    'second-repo/nested-dir',
    'second-repo/nested-dir/second-nested-dir',
  ].map(filename => path.resolve(DIR, filename));

  const repos = await findRepos(roots);
  expect(repos.git.size).toBe(0);
  expect(repos.hg.size).toBe(0);

  const slRepos = [...repos.sl];

  // it's not possible to match the exact path because it will resolve
  // differently on different platforms.
  // NOTE: This test can break if you have a .sl repo initialized inside your
  // os tmp directory.
  expect(slRepos).toHaveLength(2);
  expect(slash(slRepos[0])).toMatch(
    /\/jest-changed-files-test-dir\/first-repo\/?$/,
  );
  expect(slash(slRepos[1])).toMatch(
    /\/jest-changed-files-test-dir\/second-repo\/?$/,
  );
});

testIfSl('gets changed files for sl', async () => {
  // file1.txt is used to make a multi-line commit message
  // with `sl commit -l file1.txt`.
  // This is done to ensure that `changedFiles` only returns files
  // and not parts of commit messages.
  writeFiles(DIR, {
    'file1.txt': 'file1\n\nextra-line',
    'nested-dir/file2.txt': 'file2',
    'nested-dir/second-nested-dir/file3.txt': 'file3',
  });

  run(`${SL} init --git`, DIR);

  const roots = ['', 'nested-dir', 'nested-dir/second-nested-dir'].map(
    filename => path.resolve(DIR, filename),
  );

  let {changedFiles: files} = await getChangedFilesForRoots(roots, {});
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file1.txt',
    'file2.txt',
    'file3.txt',
  ]);

  run(`${SL} add .`, DIR);
  run(`${SL} commit -l file1.txt`, DIR);

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {}));
  expect([...files]).toEqual([]);

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {
    lastCommit: true,
  }));
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file1.txt',
    'file2.txt',
    'file3.txt',
  ]);

  writeFiles(DIR, {
    'file1.txt': 'modified file1',
  });

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {}));
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file1.txt',
  ]);

  run(`${SL} commit -m "test2"`, DIR);

  writeFiles(DIR, {
    'file4.txt': 'file4',
  });

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {
    withAncestor: true,
  }));
  // Returns files from current uncommitted state + the last commit
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file1.txt',
    'file4.txt',
  ]);

  run(`${SL} add file4.txt`, DIR);
  run(`${SL} commit -m "test3"`, DIR);

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {
    changedSince: '.~2',
  }));
  // Returns files from the last 2 commits
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file1.txt',
    'file4.txt',
  ]);

  run(`${SL} bookmark main_branch`, DIR);
  // Back up and develop on a different branch
  run(`${SL}`, DIR);
  run(`${SL} go prev(2)`, DIR);

  writeFiles(DIR, {
    'file5.txt': 'file5',
  });
  run(`${SL} add file5.txt`, DIR);
  run(`${SL} commit -m "test4"`, DIR);

  ({changedFiles: files} = await getChangedFilesForRoots(roots, {
    changedSince: 'main_branch',
  }));
  // Returns files from this branch but not ones that only exist on main
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file5.txt',
  ]);
});

testIfSl('monitors only root paths for sl', async () => {
  writeFiles(DIR, {
    'file1.txt': 'file1',
    'nested-dir/file2.txt': 'file2',
    'nested-dir/second-nested-dir/file3.txt': 'file3',
  });

  run(`${SL} init --git`, DIR);

  const roots = [path.resolve(DIR, 'nested-dir')];

  const {changedFiles: files} = await getChangedFilesForRoots(roots, {});
  expect([...files].map(filePath => path.basename(filePath)).sort()).toEqual([
    'file2.txt',
    'file3.txt',
  ]);
});

testIfSl('handles a bad revision for "changedSince", for sl', async () => {
  writeFiles(DIR, {
    '.watchmanconfig': '',
    '__tests__/file1.test.js': "require('../file1'); test('file1', () => {});",
    'file1.js': 'module.exports = {}',
    'package.json': '{}',
  });

  run(`${SL} init --git`, DIR);
  run(`${SL} add .`, DIR);
  run(`${SL} commit -m "first"`, DIR);

  const {exitCode, stderr} = runJest(DIR, ['--changedSince=blablabla']);

  expect(exitCode).toBe(1);
  expect(stderr).toContain('Test suite failed to run');
  expect(stderr).toContain("abort: unknown revision 'blablabla'");
});
