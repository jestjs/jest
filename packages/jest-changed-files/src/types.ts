/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Config} from '@jest/types';

export type Options = {
  lastCommit?: boolean;
  withAncestor?: boolean;
  changedSince?: string;
  includePaths?: Array<Config.Path>;
};

type ChangedFiles = Set<Config.Path>;
export type Repos = {git: ChangedFiles; hg: ChangedFiles};
export type ChangedFilesPromise = Promise<{
  repos: Repos;
  changedFiles: ChangedFiles;
}>;

export type SCMAdapter = {
  findChangedFiles: (
    cwd: Config.Path,
    options: Options,
  ) => Promise<Array<Config.Path>>;
  getRoot: (cwd: Config.Path) => Promise<Config.Path | null>;
};
