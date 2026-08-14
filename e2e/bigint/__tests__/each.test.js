/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

it.each([[1n, 2n, 3n]])('adds bigints', (a, b, expected) => {
  expect(a + b).toBe(expected);
});
