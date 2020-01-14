/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ProjectConfig} from '@jest/config-utils';
import Runtime = require('jest-runtime');
import {HasteMapObject} from 'jest-haste-map';

export default (
  config: ProjectConfig,
  {hasteFS, moduleMap}: HasteMapObject,
): Runtime.Context => ({
  config,
  hasteFS,
  moduleMap,
  resolver: Runtime.createResolver(config, moduleMap),
});
