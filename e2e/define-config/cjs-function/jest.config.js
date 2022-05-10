/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {defineConfig} = require('jest');

async function getVerbose() {
  return true;
}

module.exports = defineConfig(async () => {
  const verbose = await getVerbose();

  return {
    displayName: 'cjs-async-function-config',
    verbose,
  };
});
