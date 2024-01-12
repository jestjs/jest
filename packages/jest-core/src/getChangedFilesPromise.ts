/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import type {Config} from '@jest/types';
import {
  type ChangedFilesPromise,
  getChangedFilesForRoots,
} from 'jest-changed-files';
import {formatExecError} from 'jest-message-util';

export default function getChangedFilesPromise(
  globalConfig: Config.GlobalConfig,
  configs: Array<Config.ProjectConfig>,
): ChangedFilesPromise | undefined {
  if (globalConfig.onlyChanged) {
    const allRootsForAllProjects = new Set(
      configs.flatMap(config => config.roots || []),
    );
    return getChangedFilesForRoots([...allRootsForAllProjects], {
      changedSince: globalConfig.changedSince,
      lastCommit: globalConfig.lastCommit,
      withAncestor: globalConfig.changedFilesWithAncestor,
    }).catch(error => {
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
