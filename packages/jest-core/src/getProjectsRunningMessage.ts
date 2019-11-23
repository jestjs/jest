/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default function getProjectsRunningMessage(
  projectNames: Array<string>,
): string {
  if (projectNames.length === 0) {
    return 'No project to run';
  }
  if (projectNames.length === 1) {
    return `Will run one project: ${projectNames[0]}`;
  }
  const projectsList = projectNames
    .map(getListElement)
    .sort()
    .join('\n');
  return `Will run ${projectNames.length} projects:\n` + projectsList;
}

function getListElement(content: string): string {
  return `- ${content}`;
}
