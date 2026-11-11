/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {jest} from '@jest/globals';
import {observedAtImport} from '../__test_modules__/relyOnHoisted';

const hoistedValue = jest.hoisted(() => {
  globalThis.__jestHoistedValue__ = 'set-by-hoisted-factory';
  return 'set-by-hoisted-factory';
});

afterAll(() => {
  delete globalThis.__jestHoistedValue__;
});

test('jest.hoisted factory runs before module imports are initialized', () => {
  // If the `jest.hoisted` call were not hoisted above the import, the
  // module-init read of `globalThis.__jestHoistedValue__` would have
  // observed `undefined`.
  expect(observedAtImport).toBe('set-by-hoisted-factory');
  expect(hoistedValue).toBe(observedAtImport);
});
