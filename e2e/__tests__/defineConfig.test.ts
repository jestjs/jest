/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {onNodeVersions} from '@jest/test-utils';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../define-config');

test('works with object config exported from CJS file', () => {
  const {stdout, exitCode} = runJest(path.join(DIR, 'cjs'), ['--showConfig'], {
    stripAnsi: true,
  });

  expect(exitCode).toBe(0);
  expect(stdout).toMatch('"name": "cjs-object-config"');
  expect(stdout).toMatch('"verbose": true');
});

// The versions where vm.Module exists and commonjs with "exports" is not broken
onNodeVersions('>=12.16.0', () => {
  test('works with function config exported from ESM file', () => {
    const {stdout, exitCode} = runJest(
      path.join(DIR, 'esm'),
      ['--showConfig'],
      {
        stripAnsi: true,
      },
    );

    expect(exitCode).toBe(0);
    expect(stdout).toMatch('"name": "esm-function-config"');
    expect(stdout).toMatch('"verbose": true');
  });
});

test.skip('works with async function config exported from TS file', () => {
  const {stdout, exitCode} = runJest(path.join(DIR, 'ts'), ['--showConfig'], {
    stripAnsi: true,
  });

  expect(exitCode).toBe(0);
  expect(stdout).toMatch('"name": "ts-async-function-config"');
  expect(stdout).toMatch('"verbose": true');
});
