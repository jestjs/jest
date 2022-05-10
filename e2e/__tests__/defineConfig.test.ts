/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {onNodeVersions} from '@jest/test-utils';
import {getConfig} from '../runJest';

const DIR = path.resolve(__dirname, '../define-config');

test('works with object config exported from CJS file', () => {
  const {configs, globalConfig} = getConfig(path.join(DIR, 'cjs-object'));

  expect(configs).toHaveLength(1);
  expect(configs[0].displayName?.name).toBe('cjs-object-config');
  expect(globalConfig.verbose).toBe(true);
});

test('works with function config exported from CJS file', () => {
  const {configs, globalConfig} = getConfig(path.join(DIR, 'cjs-function'));

  expect(configs).toHaveLength(1);
  expect(configs[0].displayName?.name).toBe('cjs-async-function-config');
  expect(globalConfig.verbose).toBe(true);
});

// The versions where vm.Module exists and commonjs with "exports" is not broken
onNodeVersions('>=12.16.0', () => {
  test('works with object config exported from ESM file', () => {
    const {configs, globalConfig} = getConfig(path.join(DIR, 'esm-object'));

    expect(configs).toHaveLength(1);
    expect(configs[0].displayName?.name).toBe('esm-object-config');
    expect(globalConfig.verbose).toBe(true);
  });

  test('works with function config exported from ESM file', () => {
    const {configs, globalConfig} = getConfig(path.join(DIR, 'esm-function'));

    expect(configs).toHaveLength(1);
    expect(configs[0].displayName?.name).toBe('esm-async-function-config');
    expect(globalConfig.verbose).toBe(true);
  });
});
