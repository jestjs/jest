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
  expect(result.stdout).toContain('Tests must be defined synchronously');
  expect(result.stdout).toContain(
    'at Object.describe (__tests__/describeReturnPromise.test.js',
  );
});

it('warns if describe returns something', () => {
  const result = runJest('declaration-errors', [
    'describeReturnSomething.test.js',
  ]);

  expect(result.status).toBe(0);
  expect(result.stdout).toContain(
    '"describe" callback must not return a value',
  );
  expect(result.stdout).toContain(
    'at Object.describe (__tests__/describeReturnSomething.test.js',
  );
});
