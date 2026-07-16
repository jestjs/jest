/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test('resolve node module', () => {
  const result = runJest('resolve-node-module');
  expect(result.exitCode).toBe(0);
});
