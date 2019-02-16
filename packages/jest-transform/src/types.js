/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Glob, Path} from 'types/Config';

// TODO: Pick from `GlobalConfig`
export type Options = {|
  changedFiles: ?Set<Path>,
  collectCoverage: boolean,
  collectCoverageFrom: Array<Glob>,
  collectCoverageOnlyFrom: ?{[key: string]: boolean, __proto__: null},
  extraGlobals?: Array<string>,
  isCoreModule?: boolean,
  isInternalModule?: boolean,
|};
