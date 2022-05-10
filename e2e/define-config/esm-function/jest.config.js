/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import jest from 'jest';

async function getVerbose() {
  return true;
}

export default jest.defineConfig(async () => {
  const verbose = await getVerbose();

  return {
    displayName: 'esm-async-function-config',
    verbose,
  };
});
