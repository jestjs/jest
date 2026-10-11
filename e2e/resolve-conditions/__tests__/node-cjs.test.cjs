/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {fn} = require('fake-dual-cjs-dep');

test('require() uses the `node` condition in the node environment', () => {
  expect(fn()).toBe('hello from node');
});
