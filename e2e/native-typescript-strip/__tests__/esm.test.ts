/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect, test} from '@jest/globals';
import {double} from '../double.mts';

test('strips types from an ESM test file', () => {
  const value: number = double(21);
  expect(value).toBe(42);
});
