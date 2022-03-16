/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* global window */

'use strict';

const mockPerformanceMark = jest.fn();
window.performance.mark = mockPerformanceMark;

test('fakes all timers APIs', () => {
  jest.useFakeTimers();

  expect(window.performance.mark).toBeUndefined();
});

test('does not fake `performance` instance', () => {
  jest.useFakeTimers({doNotFake: ['performance']});

  expect(window.performance.mark).toBe(mockPerformanceMark);
});
