/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import {
  clearFsCache,
  findClosestPackageJson,
  isDirectory,
  isFile,
  readPackageCached,
  realpathSync,
} from '../fileWalkers';

jest.mock('graceful-fs', () => ({
  readFileSync: jest.fn(),
  realpathSync: Object.assign(jest.fn(), {native: jest.fn()}),
  statSync: jest.fn(),
}));

const mockStatSync = jest.mocked(fs.statSync);
const mockReadFileSync = jest.mocked(fs.readFileSync);
const mockRealpathNative = jest.mocked(fs.realpathSync.native);

const fileStats = {
  isDirectory: () => false,
  isFIFO: () => false,
  isFile: () => true,
} as fs.Stats;
const fifoStats = {
  isDirectory: () => false,
  isFIFO: () => true,
  isFile: () => false,
} as fs.Stats;
const dirStats = {
  isDirectory: () => true,
  isFIFO: () => false,
  isFile: () => false,
} as fs.Stats;
const socketStats = {
  isDirectory: () => false,
  isFIFO: () => false,
  isFile: () => false,
} as fs.Stats;

beforeEach(() => {
  jest.clearAllMocks();
  clearFsCache();
});

describe('isFile and isDirectory', () => {
  test('map stat results, treating FIFOs as files', () => {
    mockStatSync
      .mockReturnValueOnce(fileStats)
      .mockReturnValueOnce(dirStats)
      .mockReturnValueOnce(fifoStats)
      .mockReturnValueOnce(socketStats);

    expect(isFile('/a')).toBe(true);
    expect(isDirectory('/b')).toBe(true);
    expect(isFile('/c')).toBe(true);
    expect(isFile('/d')).toBe(false);
  });

  test('a missing path is neither file nor directory', () => {
    mockStatSync.mockReturnValue(undefined);

    expect(isFile('/missing')).toBe(false);
    expect(isDirectory('/missing')).toBe(false);
  });

  test('stats each path once', () => {
    mockStatSync.mockReturnValue(fileStats);

    isFile('/a');
    isFile('/a');
    isDirectory('/a');

    expect(mockStatSync).toHaveBeenCalledTimes(1);
  });

  test('swallows ENOTDIR but rethrows other errors', () => {
    mockStatSync.mockImplementationOnce(() => {
      throw Object.assign(new Error('ENOTDIR'), {code: 'ENOTDIR'});
    });
    expect(isFile('/a/file.js/nested')).toBe(false);

    mockStatSync.mockImplementationOnce(() => {
      throw Object.assign(new Error('EACCES'), {code: 'EACCES'});
    });
    expect(() => isFile('/forbidden')).toThrow('EACCES');
  });
});

describe('realpathSync', () => {
  test('caches the answer under the input and the result', () => {
    mockRealpathNative.mockReturnValue('/real');

    expect(realpathSync('/link')).toBe('/real');
    expect(realpathSync('/link')).toBe('/real');
    expect(realpathSync('/real')).toBe('/real');

    expect(mockRealpathNative).toHaveBeenCalledTimes(1);
  });

  test('returns the input when the path does not exist', () => {
    mockRealpathNative.mockImplementation(() => {
      throw Object.assign(new Error('ENOENT'), {code: 'ENOENT'});
    });

    expect(realpathSync('/missing')).toBe('/missing');
  });
});

describe('readPackageCached', () => {
  test('parses each package.json once', () => {
    mockReadFileSync.mockReturnValue('{"type": "module"}');

    expect(readPackageCached('/a/package.json')).toEqual({type: 'module'});
    expect(readPackageCached('/a/package.json')).toEqual({type: 'module'});

    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
  });
});

describe('findClosestPackageJson', () => {
  const root = path.resolve('/repo');
  const srcDir = path.join(root, 'src');
  const rootPackageJson = path.join(root, 'package.json');

  test('walks up to the closest package.json', () => {
    mockStatSync.mockImplementation(statedPath => {
      if (statedPath === srcDir) return dirStats;
      if (statedPath === rootPackageJson) return fileStats;
      return undefined;
    });

    expect(findClosestPackageJson(srcDir)).toBe(rootPackageJson);
  });

  test('returns undefined when no package.json exists up to the root', () => {
    mockStatSync.mockImplementation(statedPath =>
      statedPath === srcDir ? dirStats : undefined,
    );

    expect(findClosestPackageJson(srcDir)).toBeUndefined();
  });

  test('starts from the parent directory for a file path', () => {
    const filePath = path.join(srcDir, 'index.js');
    mockStatSync.mockImplementation(statedPath => {
      if (statedPath === filePath) return fileStats;
      if (statedPath === rootPackageJson) return fileStats;
      return undefined;
    });

    expect(findClosestPackageJson(filePath)).toBe(rootPackageJson);
  });
});

describe('clearFsCache', () => {
  test('drops the stat cache', () => {
    mockStatSync.mockReturnValue(fileStats);

    isFile('/a');
    clearFsCache();
    isFile('/a');

    expect(mockStatSync).toHaveBeenCalledTimes(2);
  });
});
