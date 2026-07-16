/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import runJest from '../runJest';

const consoleDir = path.resolve(__dirname, '../console');
const eachDir = path.resolve(__dirname, '../each');

expect.addSnapshotSerializer({
  print: value => value,
  test: received => typeof received === 'string',
});

test('works with passing tests', () => {
  const {exitCode} = runJest(eachDir, [
    'success.test.js',
    '--runInBand',
    '--collect-coverage',
    '--coverageReporters',
    'text-summary',
    '--clear-mocks',
    '--useStderr',
  ]);
  expect(exitCode).toBe(0);
});

test('throws error for unknown dashed & camelcase args', () => {
  const {exitCode, stderr} = runJest(consoleDir, [
    'success.test.js',
    '--runInBand',
    '--collect-coverage',
    '--coverageReporters',
    'text-summary',
    '--clear-mocks',
    '--doesNotExist',
    '--also-does-not-exist',
    '--useStderr',
  ]);
  expect(stderr).toMatchInlineSnapshot(`
    ● Unrecognized CLI Parameters:

      Following options were not recognized:
      ["doesNotExist", "also-does-not-exist"]

      CLI Options Documentation:
      https://jestjs.io/docs/cli

  `);
  expect(exitCode).toBe(1);
});
