/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-config-loader esbuild-register
 */

import {type Config, defineConfig} from 'jest';

export default defineConfig(async () => {
  const baseConfig = await new Promise<Config>(resolve => {
    setTimeout(() => {
      resolve({
        testEnvironment: 'node',
      });
    });
  });

  return {
    ...baseConfig,
    displayName: 'callback-config',
  };
});
