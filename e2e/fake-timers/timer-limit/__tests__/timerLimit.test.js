/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

test('timerLimit test', () => {
  jest.useFakeTimers({timerLimit: 10});

  setTimeout(function infinitelyRecursingCallback() {
    setTimeout(infinitelyRecursingCallback, 0);
  }, 0);

  expect(() => {
    jest.runAllTimers();
  }).toThrow(
    new Error('Aborting after running 10 timers, assuming an infinite loop!'),
  );
});
