/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import pLimit = require('p-limit');
import {isNonNullable} from 'jest-util';
import git from './git';
import hg from './hg';
import sl from './sl';
import type {ChangedFilesPromise, Options, Repos} from './types';

export type {ChangedFiles, ChangedFilesPromise} from './types';

// This is an arbitrary number. The main goal is to prevent projects with
// many roots (50+) from spawning too many processes at once.
const mutex = pLimit(5);

const findGitRoot = (dir: string) => mutex(() => git.getRoot(dir));
const findHgRoot = (dir: string) => mutex(() => hg.getRoot(dir));
const findSlRoot = (dir: string) => mutex(() => sl.getRoot(dir));

export const getChangedFilesForRoots = async (
  roots: Array<string>,
  options: Options,
): ChangedFilesPromise => {
  const repos = await findRepos(roots);

  const changedFilesOptions = {includePaths: roots, ...options};

  const gitPromises = Array.from(repos.git, repo =>
    git.findChangedFiles(repo, changedFilesOptions),
  );

  const hgPromises = Array.from(repos.hg, repo =>
    hg.findChangedFiles(repo, changedFilesOptions),
  );

  const slPromises = Array.from(repos.sl, repo =>
    sl.findChangedFiles(repo, changedFilesOptions),
  );

  const changedFiles = (
    await Promise.all([...gitPromises, ...hgPromises, ...slPromises])
  ).reduce((allFiles, changedFilesInTheRepo) => {
    for (const file of changedFilesInTheRepo) {
      allFiles.add(file);
    }

    return allFiles;
  }, new Set<string>());

  return {changedFiles, repos};
};

export const findRepos = async (roots: Array<string>): Promise<Repos> => {
  const [gitRepos, hgRepos, slRepos] = await Promise.all([
    Promise.all(roots.map(findGitRoot)),
    Promise.all(roots.map(findHgRoot)),
    Promise.all(roots.map(findSlRoot)),
  ]);

  return {
    git: new Set(gitRepos.filter(isNonNullable)),
    hg: new Set(hgRepos.filter(isNonNullable)),
    sl: new Set(slRepos.filter(isNonNullable)),
  };
};
