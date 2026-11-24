/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

jest
  .mock('node:vm', () => ({
    ...jest.requireActual<typeof import('node:vm')>('node:vm'),
    // `shouldLoadAsEsm` only checks that this is a function - the tests must
    // not depend on running with `--experimental-vm-modules`.
    SyntheticModule: function SyntheticModule() {},
  }))
  .mock('../fileWalkers', () => ({
    ...jest.requireActual<typeof import('../fileWalkers')>('../fileWalkers'),
    findClosestPackageJson: jest.fn(),
    readPackageCached: jest.fn(),
  }));

import {findClosestPackageJson, readPackageCached} from '../fileWalkers';
import shouldLoadAsEsm, {clearCachedLookups} from '../shouldLoadAsEsm';

const mockFindClosestPackageJson = jest.mocked(findClosestPackageJson);
const mockReadPackageCached = jest.mocked(readPackageCached);

beforeEach(() => {
  jest.clearAllMocks();
  clearCachedLookups();

  mockFindClosestPackageJson.mockImplementation(start =>
    start.startsWith('/esm-project')
      ? '/esm-project/package.json'
      : '/cjs-project/package.json',
  );
  mockReadPackageCached.mockImplementation(path =>
    path === '/esm-project/package.json' ? {type: 'module'} : {},
  );
});

test('.mjs is always ESM and .cjs never is, without consulting package.json', () => {
  expect(shouldLoadAsEsm('/esm-project/file.mjs', [])).toBe(true);
  expect(shouldLoadAsEsm('/esm-project/file.cjs', ['.cjs'])).toBe(false);

  expect(mockFindClosestPackageJson).not.toHaveBeenCalled();
});

test('other extensions follow extensionsToTreatAsEsm', () => {
  expect(shouldLoadAsEsm('/cjs-project/file.ts', ['.ts'])).toBe(true);
  expect(shouldLoadAsEsm('/cjs-project/file.jsx', ['.ts'])).toBe(false);
});

test('.js follows the closest package.json type field', () => {
  expect(shouldLoadAsEsm('/esm-project/file.js', [])).toBe(true);
  expect(shouldLoadAsEsm('/cjs-project/file.js', [])).toBe(false);
});

test('the same path with different extensionsToTreatAsEsm gets its own answer', () => {
  expect(shouldLoadAsEsm('/cjs-project/file.ts', ['.ts'])).toBe(true);
  expect(shouldLoadAsEsm('/cjs-project/file.ts', [])).toBe(false);
});

test('repeated lookups of the same file do no package.json work', () => {
  shouldLoadAsEsm('/esm-project/file.js', []);
  shouldLoadAsEsm('/esm-project/file.js', []);

  expect(mockFindClosestPackageJson).toHaveBeenCalledTimes(1);
});

test('files in the same directory share one package.json lookup', () => {
  shouldLoadAsEsm('/esm-project/one.js', []);
  shouldLoadAsEsm('/esm-project/two.js', []);

  expect(mockFindClosestPackageJson).toHaveBeenCalledTimes(1);
});

test('a broken package.json is treated as CJS', () => {
  mockReadPackageCached.mockImplementation(() => {
    throw new Error('boom');
  });

  expect(shouldLoadAsEsm('/esm-project/file.js', [])).toBe(false);
});

test('clearCachedLookups drops all cached answers', () => {
  shouldLoadAsEsm('/esm-project/file.js', []);
  clearCachedLookups();
  shouldLoadAsEsm('/esm-project/file.js', []);

  expect(mockFindClosestPackageJson).toHaveBeenCalledTimes(2);
});
