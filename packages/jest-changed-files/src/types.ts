/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Path} from '@jest/config-utils';

export type Options = {
  lastCommit?: boolean;
  withAncestor?: boolean;
  changedSince?: string;
  includePaths?: Array<Path>;
};

type Paths = Set<Path>;
export type Repos = {git: Paths; hg: Paths};
export type ChangedFiles = {repos: Repos; changedFiles: Paths};
export type ChangedFilesPromise = Promise<ChangedFiles>;

export type SCMAdapter = {
  findChangedFiles: (cwd: Path, options: Options) => Promise<Array<Path>>;
  getRoot: (cwd: Path) => Promise<Path | null>;
};
