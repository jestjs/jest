/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import {onNodeVersions} from '@jest/test-utils';
import {extractSummary, runYarnInstall} from '../Utils';
import runJest, {getConfig} from '../runJest';

// for unknown reason the "runs test with native ESM" test occasionally ends up
// with process being killed with SIGSEGV (Segmentation fault) signal
jest.retryTimes(3);

const DIR = resolve(__dirname, '../native-esm');

beforeAll(() => {
  runYarnInstall(DIR);
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

// minimum version supported by discord.js
onNodeVersions('>=16.9.0', () => {
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

test('runs WebAssembly (Wasm) test with native ESM', () => {
  const {exitCode, stderr, stdout} = runJest(DIR, ['native-esm-wasm.test.js'], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  });

  const {summary} = extractSummary(stderr);

  expect(summary).toMatchSnapshot();
  expect(stdout).toBe('');
  expect(exitCode).toBe(0);
});
