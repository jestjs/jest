/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

test('works when resetMocks is set in Jest config', () => {
  const f = jest.fn();
  setTimeout(f, 0);
  jest.runAllTimers();
  expect(f).toHaveBeenCalledTimes(1);
});
