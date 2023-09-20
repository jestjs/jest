/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import type {Config} from '@jest/types';
import getProjectDisplayName from './getProjectDisplayName';

export default function getProjectNamesMissingWarning(
  projectConfigs: Array<Config.ProjectConfig>,
  opts: {
    ignoreProjects: Array<string> | undefined;
    selectProjects: Array<string> | undefined;
  },
): string | undefined {
  const numberOfProjectsWithoutAName = projectConfigs.filter(
    config => !getProjectDisplayName(config),
  ).length;
  if (numberOfProjectsWithoutAName === 0) {
    return undefined;
  }
  const args: Array<string> = [];
  if (opts.selectProjects) {
    args.push('--selectProjects');
  }
  if (opts.ignoreProjects) {
    args.push('--ignoreProjects');
  }
  return chalk.yellow(
    `You provided values for ${args.join(' and ')} but ${
      numberOfProjectsWithoutAName === 1
        ? 'a project does not have a name'
        : `${numberOfProjectsWithoutAName} projects do not have a name`
    }.\n` +
      'Set displayName in the config of all projects in order to disable this warning.\n',
  );
}
