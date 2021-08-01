/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

 import runJest from '../runJest';
test('suite with mock name, mock called 5 times', () => {
  const {stderr, exitCode} = runJest(
    'mock-names/with-mock-name-call-times-pass',
  );

  expect(exitCode).toBe(0);
  expect(stderr).toMatch(/PASS/);
});