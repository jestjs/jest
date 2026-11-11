/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import runJest from '../runJest';

const DIR = resolve(__dirname, '../native-esm-sync-linker');

test('sync linker handles diamond + cycle graph', () => {
  const {exitCode, stderr} = runJest(DIR, ['sync-linker.test.js'], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  });

  expect(stderr).toContain('1 passed');
  expect(exitCode).toBe(0);
});
