/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import type {HasteMapObject} from 'jest-haste-map';
import Runtime, {Context} from 'jest-runtime';

export default (
  config: Config.ProjectConfig,
  {hasteFS, moduleMap}: HasteMapObject,
): Context => ({
  config,
  hasteFS,
  moduleMap,
  resolver: Runtime.createResolver(config, moduleMap),
});
