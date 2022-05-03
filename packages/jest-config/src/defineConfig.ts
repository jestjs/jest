/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Config} from '@jest/types';

export type JestConfig = Config.InitialOptions;

/**
 * Type helper that provides the correct typings for your Jest configuration.
 */
export default async function defineConfig(
  jestConfig: JestConfig | (() => JestConfig) | (() => Promise<JestConfig>),
): Promise<JestConfig> {
  if (typeof jestConfig === 'function') {
    return jestConfig();
  }
  return jestConfig;
}
