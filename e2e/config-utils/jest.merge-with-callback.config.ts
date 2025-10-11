/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-config-loader esbuild-register
 */

import {defineConfig, mergeConfig} from 'jest';
import jestConfig from './jest.config';

export default defineConfig(() =>
  mergeConfig(
    jestConfig,
    defineConfig({
      displayName: 'merge-with-callback',
      testEnvironment: 'jsdom',
    }),
  ),
);
