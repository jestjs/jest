/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import getProjectDisplayName from './getProjectDisplayName';

export default function getConfigsOfProjectsToRun(
  namesOfProjectsToRun: Array<string>,
  projectConfigs: Array<Config.ProjectConfig>,
): Array<Config.ProjectConfig> {
  const setOfProjectsToRun = new Set<string>(namesOfProjectsToRun);
  return projectConfigs.filter(config => {
    const name = getProjectDisplayName(config);
    return name && setOfProjectsToRun.has(name);
  });
}
