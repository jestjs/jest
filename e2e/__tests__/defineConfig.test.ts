/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {onNodeVersions} from '@jest/test-utils';
import {cleanup, writeFiles} from '../Utils';
import {getConfig} from '../runJest';

const DIR = path.resolve(__dirname, '../define-config');

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('works with object config exported from CJS file', () => {
  writeFiles(DIR, {
    '__tests__/dummy.test.js': "test('dummy', () => expect(123).toBe(123));",
    'jest.config.js': `
      const {defineConfig} = require('jest');
      module.exports = defineConfig({displayName: 'cjs-object-config', verbose: true});
      `,
    'package.json': '{}',
  });

  const {configs, globalConfig} = getConfig(path.join(DIR));

  expect(configs).toHaveLength(1);
  expect(configs[0].displayName?.name).toBe('cjs-object-config');
  expect(globalConfig.verbose).toBe(true);
});

test('works with function config exported from CJS file', () => {
  writeFiles(DIR, {
    '__tests__/dummy.test.js': "test('dummy', () => expect(123).toBe(123));",
    'jest.config.js': `
      const {defineConfig} = require('jest');
      async function getVerbose() {return true;}
        module.exports = defineConfig(async () => {
        const verbose = await getVerbose();
        return {displayName: 'cjs-async-function-config', verbose };
      });
      `,
    'package.json': '{}',
  });

  const {configs, globalConfig} = getConfig(path.join(DIR));

  expect(configs).toHaveLength(1);
  expect(configs[0].displayName?.name).toBe('cjs-async-function-config');
  expect(globalConfig.verbose).toBe(true);
});

// The versions where vm.Module exists and commonjs with "exports" is not broken
onNodeVersions('>=12.16.0', () => {
  test('works with object config exported from ESM file', () => {
    writeFiles(DIR, {
      '__tests__/dummy.test.js': "test('dummy', () => expect(123).toBe(123));",
      'jest.config.js': `
        import jest from 'jest';
        export default jest.defineConfig({displayName: 'esm-object-config', verbose: true});
        `,
      'package.json': '{"type": "module"}',
    });

    const {configs, globalConfig} = getConfig(path.join(DIR));

    expect(configs).toHaveLength(1);
    expect(configs[0].displayName?.name).toBe('esm-object-config');
    expect(globalConfig.verbose).toBe(true);
  });

  test('works with function config exported from ESM file', () => {
    writeFiles(DIR, {
      '__tests__/dummy.test.js': "test('dummy', () => expect(123).toBe(123));",
      'jest.config.js': `
        import jest from 'jest';
        async function getVerbose() {return true;}
        export default jest.defineConfig(async () => {
          const verbose = await getVerbose();
          return {displayName: 'esm-async-function-config', verbose};
        });
        `,
      'package.json': '{"type": "module"}',
    });

    const {configs, globalConfig} = getConfig(path.join(DIR));

    expect(configs).toHaveLength(1);
    expect(configs[0].displayName?.name).toBe('esm-async-function-config');
    expect(globalConfig.verbose).toBe(true);
  });
});
