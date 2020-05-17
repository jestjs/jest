/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test('Verbose Reporter', () => {
  const {exitCode, stdout} = runJest('verbose-reporter');

  expect(exitCode).toBe(1);
  expect(stdout).toMatch('works just fine');
  expect(stdout).toMatch('does not work');
  expect(stdout).toMatch(/Verbose\n.*?works/);
});
