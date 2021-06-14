/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* global requestAnimationFrame */

'use strict';

test('requestAnimationFrame', () => {
  jest.useFakeTimers('legacy');
  let exited = false;
  requestAnimationFrame(() => {
    exited = true;
  });

  jest.advanceTimersByTime(15);

  expect(exited).toBe(false);

  jest.advanceTimersByTime(1);

  expect(exited).toBe(true);
});
