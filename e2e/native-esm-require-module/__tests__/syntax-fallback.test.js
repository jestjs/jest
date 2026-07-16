/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

test('require() of .js with ESM syntax falls back to require(esm)', () => {
  const ns = require('../fake-esm-js.js');
  expect(ns.fakeEsmValue).toBe(123);
});

test('await import() of .js with ESM syntax falls back to ESM', async () => {
  const ns = await import('../fake-esm-js.js');
  expect(ns.fakeEsmValue).toBe(123);
});
