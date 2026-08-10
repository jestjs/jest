/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test('suite with auto-restore', () => {
  const result = runJest('auto-restore-mocks/with-auto-restore');
  expect(result.exitCode).toBe(0);
});

test('suite without auto-restore', () => {
  const result = runJest('auto-restore-mocks/without-auto-restore');
  expect(result.exitCode).toBe(0);
});
