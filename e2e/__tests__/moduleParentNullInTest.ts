/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test('module.parent should be null in test files', () => {
  const {exitCode} = runJest('module-parent-null-in-test');

  expect(exitCode).toBe(0);
});
