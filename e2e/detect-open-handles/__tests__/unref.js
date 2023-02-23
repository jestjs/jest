/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

test('something', () => {
  const timeout = setTimeout(() => {}, 30000);
  timeout.unref();
  expect(true).toBe(true);
});
