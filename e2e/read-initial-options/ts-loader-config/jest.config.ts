/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-config-loader ts-loader
 */

interface Config {
  jestConfig: string;
}

export default {
  jestConfig: 'jest.config.ts',
} as Config;
