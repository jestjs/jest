/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

test('imports modules sharing a top-level-await dependency concurrently', async () => {
  const [a, b] = await Promise.all([
    import('../tlaImporterA.js'),
    import('../tlaImporterB.js'),
  ]);

  expect(a.fromA).toBe('a');
  expect(b.fromB).toBe('b');
  expect(a.value).toBe('tla-value');
  expect(b.value).toBe('tla-value');
});
