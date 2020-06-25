/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import {ChangedFilesPromise, getChangedFilesForRoots} from 'jest-changed-files';
import {formatExecError} from 'jest-message-util';
import chalk = require('chalk');

export default (
  globalConfig: Config.GlobalConfig,
  configs: Array<Config.ProjectConfig>,
): ChangedFilesPromise | undefined => {
  if (globalConfig.onlyChanged) {
    const allRootsForAllProjects = configs.reduce<Array<Config.Path>>(
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

      // We do process.exit, so this is dead code
      return Promise.reject(e);
    });
  }

  return undefined;
};
