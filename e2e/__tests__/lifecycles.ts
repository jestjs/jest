/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test('suite with invalid assertions in afterAll', () => {
  const {stderr, exitCode} = runJest('lifecycles');
  expect(stderr).toMatch(/afterAll just failed!/);
  expect(exitCode).toBe(1);
});
