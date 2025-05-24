/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* global window */

'use strict';

const mockPerformanceMark = jest.fn();
globalThis.performance.mark = mockPerformanceMark;

test('fakes all APIs', () => {
  jest.useFakeTimers();

  expect(globalThis.performance.mark).not.toBe(mockPerformanceMark);
});

test('does not fake `performance` instance', () => {
  jest.useFakeTimers({doNotFake: ['performance']});

  expect(globalThis.performance.mark).toBe(mockPerformanceMark);
});
