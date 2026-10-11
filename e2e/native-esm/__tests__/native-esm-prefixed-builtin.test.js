/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

test('imports a builtin that only exists behind the node: prefix', async () => {
  const sqlite = await import('node:sqlite');

  expect(typeof sqlite.DatabaseSync).toBe('function');
});
