/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ivm from 'isolated-vm';

test('supports native modules exported via CJS', () => {
  expect(ivm).toBeDefined();
});
