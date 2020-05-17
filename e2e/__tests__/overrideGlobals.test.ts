/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test('overriding native promise does not freeze Jest', () => {
  const run = runJest('override-globals');
  expect(run.stdout).toMatch(/PASS __tests__(\/|\\)index.js/);
});

test('has a duration even if time is faked', () => {
  const regex = /works well \((\d+) ms\)/;
  const {stdout} = runJest('override-globals', ['--verbose']);

  expect(stdout).toMatch(regex);

  const [, duration] = stdout.match(regex)!;

  expect(Number(duration)).toBeGreaterThan(0);
});
