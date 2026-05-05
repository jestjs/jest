/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-config-loader esbuild-register
 */

import {mergeConfig} from 'jest';
import baseConfig from './jest.config';

export default mergeConfig(baseConfig, {
  displayName: 'merge-config',
  testEnvironment: 'jsdom',
});
