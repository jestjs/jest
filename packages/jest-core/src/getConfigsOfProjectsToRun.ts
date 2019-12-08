/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Config} from '@jest/types';
import getProjectDisplayName from './getProjectDisplayName';

export default function getConfigsOfProjectsToRun(
  argv: Config.Argv,
  projectConfigs: Array<Config.ProjectConfig>,
): Array<Config.ProjectConfig> {
  if (!argv.runProjects) {
    return projectConfigs;
  }
  const namesOfProjectsToRun = new Set<string>(argv.runProjects);
  return projectConfigs.filter(config => {
    const name = getProjectDisplayName(config);
    return name && namesOfProjectsToRun.has(name);
  });
}
