/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from 'chalk';
import type {Config} from '@jest/types';
import {
  type ChangedFilesPromise,
  type Repos,
  findRepos,
  getChangedFilesForRepos,
} from 'jest-changed-files';
import {formatExecError} from 'jest-message-util';

// Resolving the VCS roots shells out to `git`, `hg` and `sl` once per root,
// which dominates startup time when many projects are configured. The roots
// do not change between watch re-runs, so resolve them once per set of roots
// and reuse the result instead of spawning the subprocesses on every run.
const reposCache = new Map<string, Promise<Repos>>();

const findReposOnce = (roots: Array<string>): Promise<Repos> => {
  const cacheKey = JSON.stringify([...roots].sort());

  let reposPromise = reposCache.get(cacheKey);
  if (reposPromise === undefined) {
    reposPromise = findRepos(roots);
    reposCache.set(cacheKey, reposPromise);
  }

  return reposPromise;
};

export default function getChangedFilesPromise(
  globalConfig: Config.GlobalConfig,
  configs: Array<Config.ProjectConfig>,
): ChangedFilesPromise | undefined {
  if (globalConfig.onlyChanged) {
    const allRootsForAllProjects = new Set(
      configs.flatMap(config => config.roots || []),
    );
    const roots = [...allRootsForAllProjects];

    return findReposOnce(roots)
      .then(repos =>
        getChangedFilesForRepos(repos, roots, {
          changedSince: globalConfig.changedSince,
          lastCommit: globalConfig.lastCommit,
          withAncestor: globalConfig.changedFilesWithAncestor,
        }),
      )
      .catch(error => {
        const message = formatExecError(error, configs[0], {noStackTrace: true})
          .split('\n')
          .filter(line => !line.includes('Command failed:'))
          .join('\n');

        console.error(chalk.red(`\n\n${message}`));

        process.exit(1);
      });
  }

  return undefined;
}
