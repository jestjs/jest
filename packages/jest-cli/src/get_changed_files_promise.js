/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {GlobalConfig, ProjectConfig} from 'types/Config';
import type {ChangedFilesPromise} from 'types/ChangedFiles';
import {getChangedFilesForRoots} from 'jest-changed-files';

module.exports = (
  globalConfig: GlobalConfig,
  configs: Array<ProjectConfig>,
): ?ChangedFilesPromise => {
  if (globalConfig.onlyChanged) {
    const allRootsForAllProjects = configs.reduce(
      (roots, config) => roots.concat(config.roots || []),
      [],
    );
    return getChangedFilesForRoots(allRootsForAllProjects, {
      lastCommit: globalConfig.lastCommit,
      withAncestor: globalConfig.changedFilesWithAncestor,
    });
  }

  return undefined;
};
