/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

test('fake timers', () => {
  jest.useFakeTimers();
  const f = jest.fn();
  setTimeout(f, 0);
  jest.runAllTimers();
  expect(f).toHaveBeenCalledTimes(1);
});

test('getRealSystemTime', () => {
  expect(() => jest.getRealSystemTime()).toThrow(
    '`jest.getRealSystemTime()` is not available when using legacy fake timers.',
  );
});

test('setSystemTime', () => {
  expect(() => jest.setSystemTime(0)).toThrow(
    '`jest.setSystemTime()` is not available when using legacy fake timers.',
  );
});
