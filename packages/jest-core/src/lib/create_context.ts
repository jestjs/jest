/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';
import Runtime = require('jest-runtime');
import type {HasteMapObject} from 'jest-haste-map';

export default (
  config: Config.ProjectConfig,
  {hasteFS, moduleMap}: HasteMapObject,
): Runtime.Context => ({
  config,
  hasteFS,
  moduleMap,
  resolver: Runtime.createResolver(config, moduleMap),
});
