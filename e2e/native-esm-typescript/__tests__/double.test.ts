/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {double} from '../double';

test('test double', () => {
  expect(double(2)).toBe(4);
});

test('test import.meta', () => {
  expect(typeof import.meta.url).toBe('string');
});
