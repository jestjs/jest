/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {answer, double} from '../cjs-with-esm-req.cjs';

test('CJS module loaded via import can synchronously require an ESM module', () => {
  expect(answer).toBe(42);
  expect(double(21)).toBe(42);
});
