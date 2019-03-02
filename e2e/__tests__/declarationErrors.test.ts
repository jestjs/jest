/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

it('warns if describe returns a Promise', () => {
  const result = runJest('declaration-errors', [
    'describeReturnPromise.test.js',
  ]);

  expect(result.status).toBe(0);
  expect(result.stdout).toMatch(/Tests must be defined synchronously/);
});

it('warns if describe returns something', () => {
  const result = runJest('declaration-errors', [
    'describeReturnSomething.test.js',
  ]);

  expect(result.status).toBe(0);
  expect(result.stdout).toMatch(/"describe" callback must not return a value/);
});
