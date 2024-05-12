/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createRequire} from 'module';
import {resolve} from 'path';
import {onNodeVersions} from '@jest/test-utils';
import {extractSummary, runYarnInstall} from '../Utils';
import runJest, {getConfig} from '../runJest';

// for unknown reason the "runs test with native ESM" test occasionally ends up
// with process being killed with SIGSEGV (Segmentation fault) signal
jest.retryTimes(3);

const DIR = resolve(__dirname, '../native-esm');

let isolatedVmInstalled = false;

beforeAll(() => {
  runYarnInstall(DIR);

  const require = createRequire(`${DIR}/index.js`);

  try {
    const ivm = require('isolated-vm');
    isolatedVmInstalled = ivm != null;
  } catch (error) {
    console.warn('`isolated-vm` is not installed, skipping tests', error);
  }
});

test('test config is without transform', () => {
  const {configs} = getConfig(DIR);

  expect(configs).toHaveLength(1);
  expect(configs[0].transform).toEqual([]);
});

test('runs test with native ESM', () => {
  const {exitCode, stderr, stdout} = runJest(DIR, ['native-esm.test.js'], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  });

  const {summary} = extractSummary(stderr);

  expect(summary).toMatchSnapshot();
  expect(stdout).toBe('');
  expect(exitCode).toBe(0);
});

test('supports top-level await', () => {
  const {exitCode, stderr, stdout} = runJest(DIR, ['native-esm.tla.test.js'], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  });

  const {summary} = extractSummary(stderr);

  expect(summary).toMatchSnapshot();
  expect(stdout).toBe('');
  expect(exitCode).toBe(0);
});

// minimum version supported by discord.js is 16.9, but they use syntax from 16.11
onNodeVersions('>=16.11.0', () => {
  test('support re-exports from CJS of dual packages', () => {
    const {exitCode, stderr, stdout} = runJest(
      DIR,
      ['native-esm-deep-cjs-reexport.test.js'],
      {nodeOptions: '--experimental-vm-modules --no-warnings'},
    );

    const {summary} = extractSummary(stderr);

    expect(summary).toMatchSnapshot();
    expect(stdout).toBe('');
    expect(exitCode).toBe(0);
  });
});

test('support re-exports from CJS of core module', () => {
  const {exitCode, stderr, stdout} = runJest(
    DIR,
    ['native-esm-core-cjs-reexport.test.js'],
    {nodeOptions: '--experimental-vm-modules --no-warnings'},
  );

  const {summary} = extractSummary(stderr);

  expect(summary).toMatchSnapshot();
  expect(stdout).toBe('');
  expect(exitCode).toBe(0);
});

test('runs WebAssembly (Wasm) test with native ESM', () => {
  const {exitCode, stderr, stdout} = runJest(DIR, ['native-esm-wasm.test.js'], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  });

  const {summary} = extractSummary(stderr);

  expect(summary).toMatchSnapshot();
  expect(stdout).toBe('');
  expect(exitCode).toBe(0);
});

test('does not enforce import assertions', () => {
  const {exitCode, stderr, stdout} = runJest(
    DIR,
    ['native-esm-missing-import-assertions.test.js'],
    {nodeOptions: '--experimental-vm-modules --no-warnings'},
  );

  const {summary} = extractSummary(stderr);

  expect(summary).toMatchSnapshot();
  expect(stdout).toBe('');
  expect(exitCode).toBe(0);
});

(isolatedVmInstalled ? test : test.skip)(
  'properly handle re-exported native modules in ESM via CJS',
  () => {
    const {exitCode, stderr, stdout} = runJest(
      DIR,
      ['native-esm-native-module.test.js'],
      {nodeOptions: '--experimental-vm-modules --no-warnings'},
    );

    const {summary} = extractSummary(stderr);

    expect(summary).toMatchSnapshot();
    expect(stdout).toBe('');
    expect(exitCode).toBe(0);
  },
);

// support for import assertions in dynamic imports was added in Node.js 16.12.0
// support for import assertions was removed in Node.js 22.0.0
onNodeVersions('>=16.12.0 <22.0.0', () => {
  test('supports import assertions', () => {
    const {exitCode, stderr, stdout} = runJest(
      DIR,
      ['native-esm-import-assertions.test.js'],
      {nodeOptions: '--experimental-vm-modules --no-warnings'},
    );

    const {summary} = extractSummary(stderr);

    expect(summary).toMatchSnapshot();
    expect(stdout).toBe('');
    expect(exitCode).toBe(0);
  });
});

onNodeVersions('<16.12.0 || >=22.0.0', () => {
  test('syntax error for import assertions', () => {
    const {exitCode, stderr, stdout} = runJest(
      DIR,
      ['native-esm-import-assertions.test.js'],
      {nodeOptions: '--experimental-vm-modules --no-warnings'},
    );

    const {rest} = extractSummary(stderr);

    expect(rest).toContain('SyntaxError: Unexpected identifier');
    expect(stdout).toBe('');
    expect(exitCode).toBe(1);
  });
});
