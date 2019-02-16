/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Config} from '@jest/types';

export type Options = Pick<
  Config.GlobalConfig,
  | 'collectCoverage'
  | 'collectCoverageFrom'
  | 'collectCoverageOnlyFrom'
  | 'extraGlobals'
> & {
  changedFiles: Set<Config.Path> | undefined;
  isCoreModule?: boolean;
  isInternalModule?: boolean;
};
