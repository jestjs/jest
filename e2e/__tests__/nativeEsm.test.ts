/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import {extractSummary} from '../Utils';
import runJest, {getConfig} from '../runJest';

const DIR = resolve(__dirname, '../native-esm');

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
