/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {json as runWithJson} from '../runJest';

const DIR = path.resolve(__dirname, '../before-all-skipped');

test('correctly skip `beforeAll`s in skipped tests', () => {
  const {json} = runWithJson(DIR);
  expect(json.numTotalTests).toBe(8);
  expect(json.numPassedTests).toBe(4);
  expect(json.numPendingTests).toBe(4);
});
