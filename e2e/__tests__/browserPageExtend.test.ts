/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'node:path';
import runJest from '../runJest';

const dir = resolve(__dirname, '../browser-basic');

describe('browser page.extend integration', () => {
  test('page.extend and elementLocator work in browser', () => {
    const result = runJest(dir, ['page-extend.test.ts']);
    expect(result.exitCode).toBe(0);
  });
});
