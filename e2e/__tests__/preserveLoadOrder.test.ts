/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test("errors when you don't provide the option", () => {
  const result = runJest('esm-load-order/default');
  expect(result.exitCode).toBe(1);
});

test('works when you do provide the option', () => {
  const result = runJest('esm-load-order/preserve-load-order');
  expect(result.exitCode).toBe(0);
});
