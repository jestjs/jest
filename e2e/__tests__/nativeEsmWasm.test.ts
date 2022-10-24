/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import {json as runJest} from '../runJest';

const DIR = resolve(__dirname, '../native-esm-wasm');

test('runs WASM test with native ESM', () => {
  const {exitCode, json} = runJest(DIR, [], {
    nodeOptions:
      '--experimental-vm-modules --experimental-wasm-modules --no-warnings',
  });

  expect(exitCode).toBe(0);

  expect(json.numTotalTests).toBe(1);
  expect(json.numPassedTests).toBe(1);
});
