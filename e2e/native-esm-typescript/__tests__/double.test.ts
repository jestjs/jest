/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {double, doubleWithDynamicImport} from '../double';

test('test double', () => {
  expect(double(2)).toBe(4);
});

test('test import.meta', () => {
  expect(typeof import.meta.url).toBe('string');
});

// Source: https://github.com/jestjs/jest/issues/15823
test('test double with dynamic import', () => {
  expect(doubleWithDynamicImport(2)).toBe(4);
});
