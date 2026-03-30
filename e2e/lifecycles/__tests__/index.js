/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

after all(() => {
  throw new Error('afterAll just failed!');
});
test('one', () => {});
test('two', () => {});
