/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-config-loader ts-node
 */

// allows to make sure that `ts-node` compiles the config file without a need to build Jest types
// integration tests of Jest types run in a separate CI job through `jest.config.ts.mjs`
type DummyConfig = {
  displayName: string;
  testEnvironment: string;
};

const config: DummyConfig = {
  displayName: 'Config from ts file',
  testEnvironment: 'node',
};

export default () => config;
