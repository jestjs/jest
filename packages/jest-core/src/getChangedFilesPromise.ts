/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import type {Config} from '@jest/types';
import {ChangedFilesPromise, getChangedFilesForRoots} from 'jest-changed-files';
import {formatExecError} from 'jest-message-util';

export default function getChangedFilesPromise(
  globalConfig: Config.GlobalConfig,
  configs: Array<Config.ProjectConfig>,
): ChangedFilesPromise | undefined {
  if (globalConfig.onlyChanged) {
    const allRootsForAllProjects = configs.reduce<Array<string>>(
      (roots, config) => {
        if (config.roots) {
          roots.push(...config.roots);
        }
        return roots;
      },
      [],
    );
    return getChangedFilesForRoots(allRootsForAllProjects, {
      changedSince: globalConfig.changedSince,
      lastCommit: globalConfig.lastCommit,
      withAncestor: globalConfig.changedFilesWithAncestor,
    }).catch(e => {
      const message = formatExecError(e, configs[0], {noStackTrace: true})
        .split('\n')
        .filter(line => !line.includes('Command failed:'))
        .join('\n');

      console.error(chalk.red(`\n\n${message}`));

      process.exit(1);
    });
  }

  return undefined;
}
