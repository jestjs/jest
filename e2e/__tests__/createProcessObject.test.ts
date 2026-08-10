/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test('allows retrieving the current domain', () => {
  const result = runJest('create-process-object');

  expect(result.exitCode).toBe(0);
});
