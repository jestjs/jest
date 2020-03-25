/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import throat from 'throat';
import type {Config} from '@jest/types';

import type {ChangedFilesPromise, Options, Repos, SCMAdapter} from './types';
import git from './git';
import hg from './hg';

type RootPromise = ReturnType<SCMAdapter['getRoot']>;

export type {ChangedFiles, ChangedFilesPromise} from './types';

function notEmpty<T>(value: T | null | undefined): value is T {
  return value != null;
}

// This is an arbitrary number. The main goal is to prevent projects with
// many roots (50+) from spawning too many processes at once.
const mutex = throat(5);

const findGitRoot = (dir: string) => mutex(() => git.getRoot(dir));
const findHgRoot = (dir: string) => mutex(() => hg.getRoot(dir));

export const getChangedFilesForRoots = async (
  roots: Array<Config.Path>,
  options: Options,
): ChangedFilesPromise => {
  const repos = await findRepos(roots);

  const changedFilesOptions = {includePaths: roots, ...options};

  const gitPromises = Array.from(repos.git).map(repo =>
    git.findChangedFiles(repo, changedFilesOptions),
  );

  const hgPromises = Array.from(repos.hg).map(repo =>
    hg.findChangedFiles(repo, changedFilesOptions),
  );

  const changedFiles = (
    await Promise.all(gitPromises.concat(hgPromises))
  ).reduce((allFiles, changedFilesInTheRepo) => {
    for (const file of changedFilesInTheRepo) {
      allFiles.add(file);
    }

    return allFiles;
  }, new Set<string>());

  return {changedFiles, repos};
};

export const findRepos = async (roots: Array<Config.Path>): Promise<Repos> => {
  const gitRepos = await Promise.all(
    roots.reduce<Array<RootPromise>>(
      (promises, root) => promises.concat(findGitRoot(root)),
      [],
    ),
  );
  const hgRepos = await Promise.all(
    roots.reduce<Array<RootPromise>>(
      (promises, root) => promises.concat(findHgRoot(root)),
      [],
    ),
  );

  return {
    git: new Set(gitRepos.filter(notEmpty)),
    hg: new Set(hgRepos.filter(notEmpty)),
  };
};
