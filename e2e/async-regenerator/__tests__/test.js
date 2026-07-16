/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

test('dummy test', async () => {
  const value = await Promise.resolve(1);
  expect(value).toBe(1);
});
