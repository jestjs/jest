/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

test('fake timers with number argument', () => {
  jest.useFakeTimers();

  jest.setSystemTime(0);

  expect(Date.now()).toBe(0);

  jest.setSystemTime(1000);

  expect(Date.now()).toBe(1000);
});

test('fake timers with Date argument', () => {
  jest.useFakeTimers();

  jest.setSystemTime(new Date(0));

  expect(Date.now()).toBe(0);

  jest.setSystemTime(new Date(1000));

  expect(Date.now()).toBe(1000);
});
