/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {jest} from '@jest/globals';
import a from '../__test_modules__/a';

const {hoistedFn, hoistedConst} = jest.hoisted(() => ({
  hoistedConst: 42,
  hoistedFn: jest.fn(() => 'from-hoisted'),
}));

jest.mock('../__test_modules__/a', () => ({
  __esModule: true,
  default: hoistedFn,
  hoistedConst,
}));

test('jest.hoisted variables visible to jest.mock factory', () => {
  expect(a()).toBe('from-hoisted');
  expect(hoistedFn).toHaveBeenCalledTimes(1);
});

test('jest.hoisted returns the factory value verbatim', () => {
  expect(hoistedConst).toBe(42);
});
