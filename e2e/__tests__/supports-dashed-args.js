/**
 * Copyright (c) 2018-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import path from 'path';
import runJest from '../runJest';

const consoleDir = path.resolve(__dirname, '../console');
const eachDir = path.resolve(__dirname, '../each');

expect.addSnapshotSerializer({
  print: value => value,
  test: received => typeof received === 'string',
});

test('works with passing tests', () => {
  const result = runJest(eachDir, [
    'success.test.js',
    '--runInBand',
    '--collect-coverage',
    '--coverageReporters',
    'text-summary',
    '--detect-open-handles',
  ]);
  expect(result.status).toBe(0);
});

test('throws error for unknown dashed & camelcase args', () => {
  const result = runJest(consoleDir, [
    '--doesNotExist',
    '--also-does-not-exist',
  ]);
  expect(result.status).toBe(1);
  expect(result.stderr).toMatchInlineSnapshot(`
● Unrecognized CLI Parameters:

  Following options were not recognized:
  ["doesNotExist", "also-does-not-exist"]

  CLI Options Documentation:
  https://jestjs.io/docs/en/cli.html


`);
});
