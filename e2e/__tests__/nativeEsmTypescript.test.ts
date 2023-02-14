/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import {json as runJest} from '../runJest';

const DIR = resolve(__dirname, '../native-esm-typescript');

test('runs TS test with native ESM', () => {
  const {exitCode, json} = runJest(DIR, [], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  });

  expect(exitCode).toBe(0);

  expect(json.numTotalTests).toBe(2);
  expect(json.numPassedTests).toBe(2);
});
