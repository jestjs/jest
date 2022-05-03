/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {JestConfig, defineConfig} from 'jest';

async function getVerbose() {
  return true;
}

export default defineConfig(async () => {
  const verbose: JestConfig['verbose'] = await getVerbose();

  return {
    displayName: 'ts-async-function-config',
    verbose,
  };
});
