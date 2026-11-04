/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

test('uses the add stub', () => {
  const add = jest.fn().mockName('add').mockReturnValue(3);

  expect(add(1, 2)).toBe(3);
});

test('leaves the multiply stub unused', () => {
  const multiply = jest.fn().mockName('multiply').mockReturnValue(6);

  expect(typeof multiply).toBe('function');
});
