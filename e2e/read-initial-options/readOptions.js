/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const {readInitialOptions} = require('jest-config');
async function readConfig() {
  let config = process.argv[2];
  let options = undefined;
  if (config === '') {
    config = undefined;
  }
  if (process.argv[3]) {
    options = JSON.parse(process.argv[3]);
  }
  console.log(JSON.stringify(await readInitialOptions(config, options)));
}
readConfig().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
