/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface Options {
  lastCommit?: boolean;
  withAncestor?: boolean;
  changedSince?: string;
  includePaths?: Array<string>;
}

type Paths = Set<string>;
export interface Repos {
  git: Paths;
  hg: Paths;
  sl: Paths;
}
export interface ChangedFiles {
  repos: Repos;
  changedFiles: Paths;
}
export type ChangedFilesPromise = Promise<ChangedFiles>;

export interface SCMAdapter {
  findChangedFiles: (cwd: string, options: Options) => Promise<Array<string>>;
  getRoot: (cwd: string) => Promise<string | null>;
}
