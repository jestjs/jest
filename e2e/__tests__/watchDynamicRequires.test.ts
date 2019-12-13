/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {json as runWithJson} from '../runJest';

const dir = path.resolve(__dirname, '../watch-dynamic-requires');

test('successfully transpiles async', () => {
  const {json} = runWithJson(dir, ['--findRelatedTests', 'dynamicRequire.js']);
  expect(json.success).toBe(true);
  expect(json.numTotalTests).toBe(2);
});
