/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test("`require.main` on using `--resetModules='true'` should not be undefined", () => {
  const {exitCode} = runJest('require-main-reset-modules', [
    "--resetModules='true'",
    'resetModulesFlag',
  ]);
  expect(exitCode).toBe(0);
});

test('`require.main` on using `jest.resetModules()` should not be undefined', () => {
  const {exitCode} = runJest('require-main-reset-modules', [
    'resetModulesCall',
  ]);
  expect(exitCode).toBe(0);
});
