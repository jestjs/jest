/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import runJest from '../runJest';

const dir = path.resolve(__dirname, '../jest-object');

test('passes with seed', () => {
  const result = runJest(dir, ['get-seed.test.js', '--seed', '1234']);
  expect(result.exitCode).toBe(0);
});

test('fails with wrong seed', () => {
  const result = runJest(dir, ['get-seed.test.js', '--seed', '1111']);
  expect(result.exitCode).toBe(1);
});

test('seed always exists', () => {
  const result = runJest(dir, ['any-seed.test.js']);
  expect(result.exitCode).toBe(0);
});
