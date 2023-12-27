/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {createJest} = require('jest');

async function main() {
  const jest = await createJest();
  jest.globalConfig = {
    collectCoverage: false,
    watch: false,
    ...jest.globalConfig,
  };
  await jest.run();
  console.log('run-programmatically-core-multiple-projects completed');
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
