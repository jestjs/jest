/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

test('works before resetAllMocks is called', () => {
  jest.useFakeTimers();
  const f = jest.fn();
  setTimeout(f, 0);
  jest.runAllTimers();
  expect(f).toHaveBeenCalledTimes(1);
});

test('works after resetAllMocks is called', () => {
  jest.resetAllMocks();
  jest.useFakeTimers();
  const f = jest.fn();
  setTimeout(f, 0);
  jest.runAllTimers();
  expect(f).toHaveBeenCalledTimes(1);
});
