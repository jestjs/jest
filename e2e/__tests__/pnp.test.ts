/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {runYarnInstall} from '../Utils';
import {json as runWithJson} from '../runJest';

const DIR = path.resolve(__dirname, '..', 'pnp');

beforeEach(() => {
  runYarnInstall(DIR, {
    YARN_ENABLE_GLOBAL_CACHE: 'false',
    YARN_NODE_LINKER: 'pnp',
  });
});

it('successfully runs the tests inside `pnp/`', () => {
  const {json} = runWithJson(DIR, ['--no-cache', '--coverage'], {
    env: {
      YARN_ENABLE_GLOBAL_CACHE: 'false',
      YARN_NODE_LINKER: 'pnp',
    },
    nodeOptions: `--require ${DIR}/.pnp.cjs`,
  });

  expect(json.success).toBe(true);
  expect(json.numTotalTestSuites).toBe(2);
});
