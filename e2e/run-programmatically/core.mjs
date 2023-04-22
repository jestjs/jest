/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import jest from 'jest';

const {globalConfig, configs} = await jest.readConfigs(process.argv, ['.']);
const runConfig = Object.freeze({
  ...globalConfig,
  collectCoverage: false,
  watch: false,
});
const {results} = await jest.runCore(runConfig, configs);
console.log(`runCore success, ${results.numPassedTests} passed tests.`);
