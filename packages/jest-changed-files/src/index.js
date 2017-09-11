/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Path} from 'types/Config';
import type {ChangedFilesPromise, Options, Repos} from 'types/ChangedFiles';

import git from './git';
import hg from './hg';
import throat from 'throat';

// This is an arbitrary number. The main goal is to prevent projects with
// many roots (50+) from spawning too many processes at once.
const mutex = throat(5);

const findGitRoot = dir => mutex(() => git.getRoot(dir));
const findHgRoot = dir => mutex(() => hg.getRoot(dir));

export const getChangedFilesForRoots = async (
  roots: Array<Path>,
  options: Options,
): ChangedFilesPromise => {
  const repos = await findRepos(roots);

  const gitPromises = Array.from(repos.git).map(repo =>
    git.findChangedFiles(repo, options),
  );

  const hgPromises = Array.from(repos.hg).map(repo =>
    hg.findChangedFiles(repo, options),
  );

  const changedFiles = (await Promise.all(
    gitPromises.concat(hgPromises),
  )).reduce((allFiles, changedFilesInTheRepo) => {
    for (const file of changedFilesInTheRepo) {
      allFiles.add(file);
    }

    return allFiles;
  }, new Set());

  return {changedFiles, repos};
};

export const findRepos = async (roots: Array<Path>): Promise<Repos> => {
  const gitRepos = await Promise.all(
    roots.reduce((promises, root) => promises.concat(findGitRoot(root)), []),
  );
  const hgRepos = await Promise.all(
    roots.reduce((promises, root) => promises.concat(findHgRoot(root)), []),
  );

  return {
    git: new Set(gitRepos.filter(Boolean)),
    hg: new Set(hgRepos.filter(Boolean)),
  };
};
