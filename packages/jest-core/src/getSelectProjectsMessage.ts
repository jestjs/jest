/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as pico from 'picocolors';
import type {Config} from '@jest/types';
import getProjectDisplayName from './getProjectDisplayName';

export default function getSelectProjectsMessage(
  projectConfigs: Array<Config.ProjectConfig>,
  opts: {
    ignoreProjects: Array<string> | undefined;
    selectProjects: Array<string> | undefined;
  },
): string {
  if (projectConfigs.length === 0) {
    return getNoSelectionWarning(opts);
  }
  return getProjectsRunningMessage(projectConfigs);
}

function getNoSelectionWarning(opts: {
  ignoreProjects: Array<string> | undefined;
  selectProjects: Array<string> | undefined;
}): string {
  if (opts.ignoreProjects && opts.selectProjects) {
    return pico.yellow(
      'You provided values for --selectProjects and --ignoreProjects, but no projects were found matching the selection.\n' +
        'Are you ignoring all the selected projects?\n',
    );
  } else if (opts.ignoreProjects) {
    return pico.yellow(
      'You provided values for --ignoreProjects, but no projects were found matching the selection.\n' +
        'Are you ignoring all projects?\n',
    );
  } else if (opts.selectProjects) {
    return pico.yellow(
      'You provided values for --selectProjects but no projects were found matching the selection.\n',
    );
  } else {
    return pico.yellow('No projects were found.\n');
  }
}

function getProjectsRunningMessage(
  projectConfigs: Array<Config.ProjectConfig>,
): string {
  if (projectConfigs.length === 1) {
    const name =
      getProjectDisplayName(projectConfigs[0]) ?? '<unnamed project>';
    return `Running one project: ${pico.bold(name)}\n`;
  }
  const projectsList = projectConfigs
    .map(getProjectNameListElement)
    .sort()
    .join('\n');
  return `Running ${projectConfigs.length} projects:\n${projectsList}\n`;
}

function getProjectNameListElement(
  projectConfig: Config.ProjectConfig,
): string {
  const name = getProjectDisplayName(projectConfig);
  const elementContent = name ? pico.bold(name) : '<unnamed project>';
  return `- ${elementContent}`;
}
