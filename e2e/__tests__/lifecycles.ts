/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test('suite with invalid assertions in afterAll', () => {
  const {stdout, exitCode} = runJest('lifecycles');
  expect(stdout).toMatch(/afterAll just failed!/);
  expect(exitCode).toBe(1);
});
