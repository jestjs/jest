/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ProjectConfig} from 'types/Config';
import type {Context} from 'types/Context';
import type {HasteMap} from 'types/HasteMap';

import Runtime from 'jest-runtime';

export default (
  config: ProjectConfig,
  {hasteFS, moduleMap}: HasteMap,
): Context => ({
  config,
  hasteFS,
  moduleMap,
  resolver: Runtime.createResolver(config, moduleMap),
});
