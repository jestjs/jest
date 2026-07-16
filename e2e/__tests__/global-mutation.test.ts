/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const global = 'woo!';

test('can redefine global', () => {
  expect(global).toBe('woo!');
});
