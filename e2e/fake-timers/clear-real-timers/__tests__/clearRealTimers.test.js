/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

test('allows clearing not faked timers', () => {
  const timer = setTimeout(() => {
    throw new Error('Should not throw');
  }, 1000);

  jest.useFakeTimers();

  clearTimeout(timer);
});
