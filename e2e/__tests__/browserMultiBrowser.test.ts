/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'node:path';
import runJest from '../runJest';

const dir = resolve(__dirname, '../browser-multi-browser');

test('runs basic tests across multiple browser instances', () => {
  const result = runJest(dir, ['basic.test.ts']);
  expect(result.exitCode).toBe(0);
});
