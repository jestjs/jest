/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {ProjectConfig} from 'types/Config';
import type {Context} from 'types/Context';
import type {HasteMap} from 'types/HasteMap';

import Runtime from 'jest-runtime';

module.exports = (
  config: ProjectConfig,
  {hasteFS, moduleMap}: HasteMap,
): Context => ({
  config,
  hasteFS,
  moduleMap,
  resolver: Runtime.createResolver(config, moduleMap),
});
