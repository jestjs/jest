/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment jest-environment-jsdom
 */

const {fn} = require('fake-dual-cjs-dep');

test('require() uses the environment export conditions, not `node`', () => {
  expect(fn()).toBe('hello from browser');
});
