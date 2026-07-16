/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import runJest from '../runJest';

const DIR = path.resolve(__dirname, '../coverage-provider-v8');

test('prints coverage with missing sourcemaps', () => {
  const sourcemapDir = path.join(DIR, 'no-sourcemap');

  const {stdout, exitCode} = runJest(
    sourcemapDir,
    ['--coverage', '--coverage-provider', 'v8'],
    {stripAnsi: true},
  );

  expect(exitCode).toBe(0);
  expect(stdout).toMatchSnapshot();
});

test('prints coverage with empty sourcemaps', () => {
  const sourcemapDir = path.join(DIR, 'empty-sourcemap');

  const {stdout, exitCode} = runJest(
    sourcemapDir,
    ['--coverage', '--coverage-provider', 'v8'],
    {stripAnsi: true},
  );

  expect(exitCode).toBe(0);
  expect(stdout).toMatchSnapshot();
});

test('reports coverage with `resetModules`', () => {
  const sourcemapDir = path.join(DIR, 'with-resetModules');

  const {stdout, exitCode} = runJest(
    sourcemapDir,
    ['--coverage', '--coverage-provider', 'v8'],
    {stripAnsi: true},
  );

  expect(exitCode).toBe(0);
  expect(stdout).toMatchSnapshot();
});

test('prints correct coverage report, if a CJS module is put under test without transformation', () => {
  const sourcemapDir = path.join(DIR, 'cjs-native-without-sourcemap');

  const {stdout, exitCode} = runJest(
    sourcemapDir,
    ['--coverage', '--coverage-provider', 'v8', '--no-cache'],
    {stripAnsi: true},
  );

  expect(exitCode).toBe(0);
  expect(stdout).toMatchSnapshot();
});

test('prints correct coverage report, if a TS module is transpiled by Babel to CJS and put under test', () => {
  const sourcemapDir = path.join(DIR, 'cjs-with-babel-transformer');

  const {stdout, exitCode} = runJest(
    sourcemapDir,
    ['--coverage', '--coverage-provider', 'v8', '--no-cache'],
    {stripAnsi: true},
  );

  expect(exitCode).toBe(0);
  expect(stdout).toMatchSnapshot();
});

test('prints correct coverage report, if an ESM module is put under test without transformation', () => {
  const sourcemapDir = path.join(DIR, 'esm-native-without-sourcemap');

  const {stdout, exitCode} = runJest(
    sourcemapDir,
    ['--coverage', '--coverage-provider', 'v8', '--no-cache'],
    {
      nodeOptions: '--experimental-vm-modules --no-warnings',
      stripAnsi: true,
    },
  );

  expect(exitCode).toBe(0);
  expect(stdout).toMatchSnapshot();
});

test('prints correct coverage report, if a TS module is transpiled by custom transformer to ESM put under test', () => {
  const sourcemapDir = path.join(DIR, 'esm-with-custom-transformer');

  const {stdout, exitCode} = runJest(
    sourcemapDir,
    ['--coverage', '--coverage-provider', 'v8', '--no-cache'],
    {
      nodeOptions: '--experimental-vm-modules --no-warnings',
      stripAnsi: true,
    },
  );

  expect(exitCode).toBe(0);
  expect(stdout).toMatchSnapshot();
});

test('vm script coverage generator', () => {
  const dir = path.resolve(__dirname, '../vmscript-coverage');
  const {stdout, exitCode} = runJest(
    dir,
    ['--coverage', '--coverage-provider', 'v8'],
    {stripAnsi: true},
  );

  expect(exitCode).toBe(0);
  expect(stdout).toMatchSnapshot();
});
