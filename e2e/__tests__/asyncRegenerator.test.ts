/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {runYarnInstall} from '../Utils';
import {json as runWithJson} from '../runJest';

const dir = path.resolve(__dirname, '../async-regenerator');

beforeEach(() => {
  runYarnInstall(dir);
});

test('successfully transpiles async', () => {
  // --no-cache because babel can cache stuff and result in false green
  const {json} = runWithJson(dir, ['--no-cache']);
  expect(json.success).toBe(true);
  expect(json.numTotalTests).toBe(1);
});
