/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import execa = require('execa');
import {existsSync} from 'graceful-fs';
import {onNodeVersions} from '@jest/test-utils';
import {runYarnInstall} from '../Utils';
import {getConfig} from '../runJest';

const DIR = path.resolve(__dirname, '../define-config');

test('works with object config exported from CJS file', () => {
  const {configs, globalConfig} = getConfig(path.join(DIR, 'cjs'));

  expect(configs[0].displayName?.name).toBe('cjs-object-config');
  expect(globalConfig.verbose).toBe(true);
});

// The versions where vm.Module exists and commonjs with "exports" is not broken
onNodeVersions('>=12.16.0', () => {
  test('works with function config exported from ESM file', () => {
    const {configs, globalConfig} = getConfig(path.join(DIR, 'esm'));

    expect(configs[0].displayName?.name).toBe('esm-function-config');
    expect(globalConfig.verbose).toBe(true);
  });
});

describe('typescript', () => {
  beforeAll(async () => {
    // the typescript config test needs `@jest/types` to be built
    const cwd = path.resolve(__dirname, '../../');
    const typesPackageDirectory = 'packages/jest-types';

    const indexDTsFile = path.resolve(
      cwd,
      typesPackageDirectory,
      'build/index.d.ts',
    );

    if (!existsSync(indexDTsFile)) {
      await execa('tsc', ['-b', typesPackageDirectory], {cwd});
    }
  }, 360_000);

  test('works with async function config exported from TS file', () => {
    runYarnInstall(path.join(DIR, 'ts'));

    const {configs, globalConfig} = getConfig(path.join(DIR, 'ts'));

    expect(configs[0].displayName?.name).toBe('ts-async-function-config');
    expect(globalConfig.verbose).toBe(true);
  });
});
