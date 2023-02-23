/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type Options = {
  lastCommit?: boolean;
  withAncestor?: boolean;
  changedSince?: string;
  includePaths?: Array<string>;
};

type Paths = Set<string>;
export type Repos = {git: Paths; hg: Paths; sl: Paths};
export type ChangedFiles = {repos: Repos; changedFiles: Paths};
export type ChangedFilesPromise = Promise<ChangedFiles>;

export type SCMAdapter = {
  findChangedFiles: (cwd: string, options: Options) => Promise<Array<string>>;
  getRoot: (cwd: string) => Promise<string | null>;
};
