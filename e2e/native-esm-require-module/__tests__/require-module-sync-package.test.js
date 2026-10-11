/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

test('require() resolves a package through its "module-sync" condition', () => {
  const ns = require('module-sync-pkg');
  expect(ns.condition).toBe('module-sync');
});

test('require() of a "module-sync" package with top-level await throws ERR_REQUIRE_ASYNC_MODULE', () => {
  expect(() => require('module-sync-tla-pkg')).toThrow(
    expect.objectContaining({code: 'ERR_REQUIRE_ASYNC_MODULE'}),
  );
});
