/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import type {Config} from '@jest/types';
import getProjectDisplayName from './getProjectDisplayName';

export default function getProjectNamesMissingWarning(
  projectConfigs: Array<Config.ProjectConfig>,
): string | undefined {
  const numberOfProjectsWithoutAName = projectConfigs.filter(
    config => !getProjectDisplayName(config),
  ).length;
  if (numberOfProjectsWithoutAName === 0) {
    return undefined;
  }
  return chalk.yellow(
    `You provided values for --selectProjects but ${
      numberOfProjectsWithoutAName === 1
        ? 'a project does not have a name'
        : `${numberOfProjectsWithoutAName} projects do not have a name`
    }.\n` +
      'Set displayName in the config of all projects in order to disable this warning.\n',
  );
}
