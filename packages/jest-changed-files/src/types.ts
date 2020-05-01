/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';

export type Options = {
  lastCommit?: boolean;
  withAncestor?: boolean;
  changedSince?: string;
  includePaths?: Array<Config.Path>;
};

type Paths = Set<Config.Path>;
export type Repos = {git: Paths; hg: Paths};
export type ChangedFiles = {repos: Repos; changedFiles: Paths};
export type ChangedFilesPromise = Promise<ChangedFiles>;

export type SCMAdapter = {
  findChangedFiles: (
    cwd: Config.Path,
    options: Options,
  ) => Promise<Array<Config.Path>>;
  getRoot: (cwd: Config.Path) => Promise<Config.Path | null>;
};
