/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {TestContext} from '@jest/test-result';
import type {Config} from '@jest/types';
import type {HasteMapObject} from 'jest-haste-map';
import Runtime from 'jest-runtime';

export default function createContext(
  config: Config.ProjectConfig,
  {hasteFS, moduleMap}: HasteMapObject,
): TestContext {
  return {
    config,
    hasteFS,
    moduleMap,
    resolver: Runtime.createResolver(config, moduleMap),
  };
}
