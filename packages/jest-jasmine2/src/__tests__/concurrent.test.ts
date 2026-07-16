/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

describe('concurrent', () => {
  test.concurrent.each([
    [1, 2],
    [2, 3],
    [3, 4],
  ])('should add 1 to number', async (a, sum) => {
    expect(a + 1).toEqual(sum);
  });
});
