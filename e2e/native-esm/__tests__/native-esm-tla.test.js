/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const value = await Promise.resolve('hello!');

test('supports top level await', () => {
  expect(value).toBe('hello!');
});
