/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

test('import after done', () => {
  setTimeout(async () => {
    const {double} = await import('../double.mjs');
    expect(double(5)).toBe(10);
  }, 0);
});
