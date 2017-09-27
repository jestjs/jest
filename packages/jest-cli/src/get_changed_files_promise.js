/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {GlobalConfig, ProjectConfig} from 'types/Config';
import type {ChangedFilesPromise} from 'types/ChangedFiles';
import {getChangedFilesForRoots} from 'jest-changed-files';

export default (
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
