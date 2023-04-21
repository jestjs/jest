/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {runCore, readConfigs} = require('jest');

async function main() {
  const {globalConfig, configs} = await readConfigs(process.argv, ['.']);

  await runCore(
    {
      ...globalConfig,
      collectCoverage: false,
      watch: false,
    },
    configs,
  );
  console.log('run-programmatically-core-multiple-projects completed');
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
