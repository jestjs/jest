/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-config-loader esbuild-register
 */

import {defineConfig} from 'jest';

export default defineConfig({
  displayName: 'simple-config',
  testEnvironment: 'node',
});
