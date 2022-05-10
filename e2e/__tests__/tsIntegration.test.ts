/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {onNodeVersions} from '@jest/test-utils';
import {getConfig} from '../runJest';

const DIR = path.resolve(__dirname, '../ts-node');

test('works with object config exported from TS file', () => {
  const {configs, globalConfig} = getConfig(
    path.join(DIR, 'defineConfig-object'),
  );

  expect(configs).toHaveLength(1);
  expect(configs[0].displayName?.name).toBe('ts-object-config');
  expect(globalConfig.verbose).toBe(true);
});

test('works with function config exported from TS file', () => {
  const {configs, globalConfig} = getConfig(
    path.join(DIR, 'defineConfig-function'),
  );

  expect(configs).toHaveLength(1);
  expect(configs[0].displayName?.name).toBe('ts-async-function-config');
  expect(globalConfig.verbose).toBe(true);
});

// The versions where vm.Module exists and commonjs with "exports" is not broken
onNodeVersions('>=12.16.0', () => {
  test('works with object config exported from TS file when package.json#type=module', () => {
    const {configs, globalConfig} = getConfig(
      path.join(DIR, 'defineConfig-esm-object'),
    );

    expect(configs).toHaveLength(1);
    expect(configs[0].displayName?.name).toBe('ts-object-config');
    expect(globalConfig.verbose).toBe(true);
  });

  test('works with function config exported from TS file when package.json#type=module', () => {
    const {configs, globalConfig} = getConfig(
      path.join(DIR, 'defineConfig-esm-function'),
    );

    expect(configs).toHaveLength(1);
    expect(configs[0].displayName?.name).toBe('ts-async-function-config');
    expect(globalConfig.verbose).toBe(true);
  });
});
