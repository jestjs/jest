/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test('toThrow(JestAssertionError) passes when imported from a separate require call', () => {
  const result = runJest('jest-assertion-error-import');
  expect(result.exitCode).toBe(0);
});
