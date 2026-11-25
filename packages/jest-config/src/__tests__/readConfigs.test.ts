/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as path from 'path';
import {readConfigs} from '../';

jest.mock('graceful-fs', () => ({
  ...jest.requireActual<typeof import('fs')>('fs'),
  existsSync: jest.fn(() => true),
  lstatSync: jest.fn(() => ({
    isDirectory: () => false,
  })),
}));

test('readConfigs() throws when called without project paths', async () => {
  await expect(
    // @ts-expect-error
    readConfigs(null /* argv */, [] /* projectPaths */),
  ).rejects.toThrow('jest: No configuration found for any project.');
});

test('readConfigs() reads config with JSON config argument', async () => {
  const result = await readConfigs(
    {
      $0: 'jest',
      _: [],
      config: JSON.stringify({
        rootDir: __dirname,
        testTimeout: 5000,
      }),
    },
    [__filename],
  );

  expect(result.configs).toHaveLength(1);
  expect(result.globalConfig.testTimeout).toBe(5000);
});

test('readConfigs() resolves multiple projects when configPath is supplied and handles nonexistent project configs safely', async () => {
  const result = await readConfigs(
    {
      $0: 'jest',
      _: [],
      config: JSON.stringify({
        rootDir: __dirname,
      }),
    },
    [__filename, path.join(__dirname, 'nonexistent-subproject/file.js')],
  );

  expect(result.configs).toHaveLength(2);
});
