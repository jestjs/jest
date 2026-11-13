/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-report-unused-stubs
 */

'use strict';

test('uses every stub', () => {
  const add = jest.fn().mockName('add').mockReturnValue(3);
  const multiply = jest.fn().mockName('multiply').mockReturnValue(6);

  expect(add(1, 2)).toBe(3);
  expect(multiply(1, 2)).toBe(6);
});
