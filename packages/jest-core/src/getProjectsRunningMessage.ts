/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Config} from '@jest/types';
import getProjectDisplayName from './getProjectDisplayName';

export default function getProjectsRunningMessage(
  projectConfigs: Array<Config.ProjectConfig>,
): string {
  if (projectConfigs.length === 0) {
    return 'No project to run';
  }
  if (projectConfigs.length === 1) {
    const name = getProjectDisplayName(projectConfigs[0]);
    return `Will run one project: ${name}`;
  }
  const projectsList = projectConfigs
    .map(getProjectNameListElement)
    .sort()
    .join('\n');
  return `Will run ${projectConfigs.length} projects:\n` + projectsList;
}

function getProjectNameListElement(
  projectConfig: Config.ProjectConfig,
): string {
  const name = getProjectDisplayName(projectConfig);
  const elementContent = name || '<unnamed project>';
  return `- ${elementContent}`;
}
