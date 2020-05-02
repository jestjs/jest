/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import wrap from 'jest-snapshot-serializer-raw';
import {onNodeVersions} from '@jest/test-utils';
import runJest, {getConfig} from '../runJest';
import {extractSummary} from '../Utils';

const DIR = resolve(__dirname, '../native-esm');

test('test config is without transform', () => {
  const {configs} = getConfig(DIR);

  expect(configs).toHaveLength(1);
  expect(configs[0].transform).toEqual([]);
});

// The versions vm.Module was introduced
onNodeVersions('^12.16.0 || >=13.2.0', () => {
  test('runs test with native ESM', () => {
    const {exitCode, stderr, stdout} = runJest(DIR, [], {
      nodeOptions: '--experimental-vm-modules',
    });

    const {summary} = extractSummary(stderr);

    expect(wrap(summary)).toMatchSnapshot();
    expect(stdout).toBe('');
    expect(exitCode).toBe(0);
  });
});
