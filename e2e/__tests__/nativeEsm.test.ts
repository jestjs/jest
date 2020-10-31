/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import {onNodeVersions} from '@jest/test-utils';
import wrap from 'jest-snapshot-serializer-raw';
import {extractSummary} from '../Utils';
import runJest, {getConfig} from '../runJest';

const DIR = resolve(__dirname, '../native-esm');

test('test config is without transform', () => {
  const {configs} = getConfig(DIR);

  expect(configs).toHaveLength(1);
  expect(configs[0].transform).toEqual([]);
});

// The versions where vm.Module exists and commonjs with "exports" is not broken
onNodeVersions('^12.16.0 || >=13.7.0', () => {
  test('runs test with native ESM', () => {
    const {exitCode, stderr, stdout} = runJest(DIR, ['native-esm.test.js'], {
      nodeOptions: '--experimental-vm-modules',
    });

    const {summary} = extractSummary(stderr);

    expect(wrap(summary)).toMatchSnapshot();
    expect(stdout).toBe('');
    expect(exitCode).toBe(0);
  });
});

// The versions where TLA is supported
onNodeVersions('>=14.3.0', () => {
  test('supports top-level await', () => {
    const {exitCode, stderr, stdout} = runJest(
      DIR,
      ['native-esm.tla.test.js'],
      {nodeOptions: '--experimental-vm-modules'},
    );

    const {summary} = extractSummary(stderr);

    expect(wrap(summary)).toMatchSnapshot();
    expect(stdout).toBe('');
    expect(exitCode).toBe(0);
  });
});
