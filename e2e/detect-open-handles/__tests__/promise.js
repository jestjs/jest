/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

test('something', () => {
  // eslint-disable-next-line no-new
  new Promise(() => {});
  expect(true).toBe(true);
});
