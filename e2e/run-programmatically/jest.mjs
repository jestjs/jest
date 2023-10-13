/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import jestModule from 'jest';
const {createJest} = jestModule;

const jest = await createJest();
jest.globalConfig = {
  collectCoverage: false,
  watch: false,
  ...jest.globalConfig,
};
const {results} = await jest.run();
console.log(`run success, ${results.numPassedTests} passed tests.`);
