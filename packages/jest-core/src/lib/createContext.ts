/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {TestContext} from '@jest/test-result';
import type {Config} from '@jest/types';
import type {IHasteFS, IModuleMap} from 'jest-haste-map';
import Runtime from 'jest-runtime';

type HasteContext = {hasteFS: IHasteFS; moduleMap: IModuleMap};

export default function createContext(
  config: Config.ProjectConfig,
  {hasteFS, moduleMap}: HasteContext,
): TestContext {
  return {
    config,
    hasteFS,
    moduleMap,
    resolver: Runtime.createResolver(config, moduleMap),
  };
}
