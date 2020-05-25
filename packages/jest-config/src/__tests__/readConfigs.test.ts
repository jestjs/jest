/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {Config} from '@jest/types';
import {readConfigs} from '../index';

let mockResult;
jest.mock('graceful-fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(() => true),
  lstatSync: jest.fn(() => ({
    isDirectory: () => false,
  })),
}));
jest.mock('../readConfigFileAndSetRootDir', () => jest.fn(() => mockResult));

test('readConfigs() throws when called without project paths', async () => {
  await expect(
    // @ts-expect-error
    readConfigs(null /* argv */, [] /* projectPaths */),
  ).rejects.toThrowError('jest: No configuration found for any project.');
});

test('readConfigs() loads async config file', async () => {
  mockResult = jest.fn(async () => ({
    rootDir: './',
  }));
  await expect(
    // @ts-expect-error
    readConfigs(
      <Config.Argv>{} /* argv */,
      ['./some-jest-config-file.js'] /* projectPaths */,
    ),
  ).resolves.toHaveProperty('configs');
  expect(mockResult).toHaveBeenCalled();
});

test('readConfigs() reject if async was rejected', async () => {
  mockResult = jest.fn(async () => {
    throw new Error('Some error');
  });
  await expect(
    // @ts-expect-error
    readConfigs(
      <Config.Argv>{} /* argv */,
      ['./some-jest-config-file.js'] /* projectPaths */,
    ),
  ).rejects.toBeTruthy();
  expect(mockResult).toHaveBeenCalled();
});
