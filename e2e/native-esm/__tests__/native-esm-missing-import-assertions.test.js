/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// JSON imports without an import attribute still work, but emit a deprecation
// warning checked by the parent dispatcher in `e2e/__tests__/nativeEsm.test.ts`.
// The strict-throw behavior is deferred to the next major.

import json from '../package.json';

test('supports static import', () => {
  expect(json).toHaveProperty('jest.testEnvironment', 'node');
});

test('supports dynamic import', async () => {
  const {default: json} = await import('../package.json');
  expect(json).toHaveProperty('jest.testEnvironment', 'node');
});
