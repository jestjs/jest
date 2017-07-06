/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Path} from 'types/Config';

export type Options = {|
  lastCommit?: boolean,
  withAncestor?: boolean,
|};

export type Repos = {git: Set<Path>, hg: Set<Path>};

export type SCMAdapter = {
  findChangedFiles: (cwd: Path, options: Options) => Promise<Array<Path>>,
  getRoot: (cwd: Path) => Promise<?Path>,
};
