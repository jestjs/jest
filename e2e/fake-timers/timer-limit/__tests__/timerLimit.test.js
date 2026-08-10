/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

test('reads timerLimit from Jest config', () => {
  jest.useFakeTimers();

  setTimeout(function infinitelyRecursingCallback() {
    setTimeout(infinitelyRecursingCallback, 0);
  }, 0);

  expect(() => {
    jest.runAllTimers();
  }).toThrow(
    new Error('Aborting after running 10 timers, assuming an infinite loop!'),
  );
});

test('allows to override timerLimit set via Jest config', () => {
  jest.useFakeTimers({timerLimit: 100});

  setTimeout(function infinitelyRecursingCallback() {
    setTimeout(infinitelyRecursingCallback, 0);
  }, 0);

  expect(() => {
    jest.runAllTimers();
  }).toThrow(
    new Error('Aborting after running 100 timers, assuming an infinite loop!'),
  );
});

test('allows to override timerLimit set via Jest object', () => {
  jest.useFakeTimers({timerLimit: 1000});

  setTimeout(function infinitelyRecursingCallback() {
    setTimeout(infinitelyRecursingCallback, 0);
  }, 0);

  expect(() => {
    jest.runAllTimers();
  }).toThrow(
    new Error('Aborting after running 1000 timers, assuming an infinite loop!'),
  );
});
