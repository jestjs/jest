/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const {readInitialOptions} = require('jest-config');
async function readConfig() {
  console.log(JSON.stringify(await readInitialOptions(process.argv[2])));
}
readConfig();
