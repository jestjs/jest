/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

test('require() returns the namespace of an ESM file', () => {
  const ns = require('../esm.mjs');
  expect(ns.value).toBe('esm-export');
  expect(ns.square(5)).toBe(25);
  // Node-compatible: `default` is the named export, not unwrapped.
  expect(ns.default).toBe('default-export');
});

test('require() returns the same namespace on repeat calls', () => {
  const a = require('../esm.mjs');
  const b = require('../esm.mjs');
  expect(a).toBe(b);
});

test('require() of a file with top-level await throws ERR_REQUIRE_ASYNC_MODULE', () => {
  expect(() => require('../esm-with-tla.mjs')).toThrow(
    expect.objectContaining({code: 'ERR_REQUIRE_ASYNC_MODULE'}),
  );
});

test('require.cache exposes ESM entries with the namespace as exports', () => {
  const ns = require('../esm.mjs');
  const filename = require.resolve('../esm.mjs');
  expect(require.cache[filename]).toBeDefined();
  expect(require.cache[filename].exports).toBe(ns);
});
