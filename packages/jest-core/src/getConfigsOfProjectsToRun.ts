/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import getProjectDisplayName from './getProjectDisplayName';

export default function getConfigsOfProjectsToRun(
  projectConfigs: Array<Config.ProjectConfig>,
  opts: {
    ignoreProjects: Array<string> | undefined;
    selectProjects: Array<string> | undefined;
  },
): Array<Config.ProjectConfig> {
  const projectFilter = createProjectFilter(opts);
  return projectConfigs.filter(config => {
    const name = getProjectDisplayName(config);
    return projectFilter(name);
  });
}

const always = () => true;

function createProjectFilter(opts: {
  ignoreProjects: Array<string> | undefined;
  selectProjects: Array<string> | undefined;
}) {
  const {selectProjects, ignoreProjects} = opts;

  const selected = selectProjects
    ? (name: string | undefined) => name && selectProjects.includes(name)
    : always;

  const notIgnore = ignoreProjects
    ? (name: string | undefined) => !(name && ignoreProjects.includes(name))
    : always;

  function test(name: string | undefined) {
    return selected(name) && notIgnore(name);
  }

  return test;
}
