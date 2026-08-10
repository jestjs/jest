/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

it.concurrent.each([
  [1, 2],
  [2, 3],
])('adds one to number', async (a, b) => {
  expect(a + 1).toBe(b);
});

it.concurrent.skip.each([
  [1, 2],
  [2, 3],
])('should skip this test', Promise.resolve());
