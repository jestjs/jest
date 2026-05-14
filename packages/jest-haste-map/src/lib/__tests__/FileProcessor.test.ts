/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {DuplicateError, FileProcessor} from '../FileProcessor';
import {WorkerPool} from '../WorkerPool';
import {createEmptyMap} from '../util';

jest.mock('../WorkerPool');

const MockWorkerPool = WorkerPool as jest.MockedClass<typeof WorkerPool>;

const ROOT = '/root';

function makeOptions(overrides = {}) {
  return {
    computeDependencies: true,
    computeSha1: false,
    dependencyExtractor: null,
    hasteImplModulePath: undefined,
    mocksPattern: null,
    platforms: [],
    retainAllFiles: false,
    rootDir: ROOT,
    skipPackageJson: false,
    throwOnModuleCollision: false,
    ...overrides,
  };
}

function makeWorker(reply: object = {}) {
  return {
    getSha1: jest.fn().mockResolvedValue(reply),
    worker: jest.fn().mockResolvedValue(reply),
  };
}

describe('FileProcessor', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('processFile', () => {
    it('throws when the file is not in the haste map', () => {
      const pool = new MockWorkerPool({maxWorkers: 1});
      (pool.get as jest.Mock).mockReturnValue(makeWorker());
      const fp = new FileProcessor(makeOptions(), console, pool);
      const hasteMap = createEmptyMap();

      expect(() =>
        fp.processFile(
          hasteMap,
          hasteMap.map,
          hasteMap.mocks,
          `${ROOT}/missing.js`,
        ),
      ).toThrow('File to process was not found');
    });

    it('calls the worker and updates file metadata on success', async () => {
      const hasteMap = createEmptyMap();
      hasteMap.files.set('src/Apple.js', ['', 1000, 42, 0, '', null]);

      const worker = makeWorker({
        dependencies: ['React'],
        id: 'Apple',
        module: ['src/Apple.js', 0],
        sha1: null,
      });
      const pool = new MockWorkerPool({maxWorkers: 1});
      (pool.get as jest.Mock).mockReturnValue(worker);

      const fp = new FileProcessor(makeOptions(), console, pool);
      await fp.processFile(
        hasteMap,
        hasteMap.map,
        hasteMap.mocks,
        `${ROOT}/src/Apple.js`,
      );

      expect(worker.worker).toHaveBeenCalledTimes(1);
      expect(hasteMap.files.get('src/Apple.js')?.[0]).toBe('Apple');
    });

    it('silently removes the file on ENOENT worker error', async () => {
      const hasteMap = createEmptyMap();
      hasteMap.files.set('src/Gone.js', ['', 1000, 42, 0, '', null]);

      const enoent = Object.assign(new Error('ENOENT'), {code: 'ENOENT'});
      const worker = {
        getSha1: jest.fn(),
        worker: jest.fn().mockRejectedValue(enoent),
      };
      const pool = new MockWorkerPool({maxWorkers: 1});
      (pool.get as jest.Mock).mockReturnValue(worker);

      const fp = new FileProcessor(makeOptions(), console, pool);
      await fp.processFile(
        hasteMap,
        hasteMap.map,
        hasteMap.mocks,
        `${ROOT}/src/Gone.js`,
      );

      expect(hasteMap.files.has('src/Gone.js')).toBe(false);
    });

    it('throws DuplicateError when throwOnModuleCollision is true', async () => {
      const hasteMap = createEmptyMap();
      hasteMap.files.set('src/A.js', ['', 1000, 42, 0, '', null]);
      hasteMap.map.set('Apple', {g: ['src/existing/A.js', 0]});

      const worker = makeWorker({
        dependencies: [],
        id: 'Apple',
        module: ['src/A.js', 0],
        sha1: null,
      });
      const pool = new MockWorkerPool({maxWorkers: 1});
      (pool.get as jest.Mock).mockReturnValue(worker);

      const fp = new FileProcessor(
        makeOptions({throwOnModuleCollision: true}),
        console,
        pool,
      );

      await expect(
        fp.processFile(
          hasteMap,
          hasteMap.map,
          hasteMap.mocks,
          `${ROOT}/src/A.js`,
        ),
      ).rejects.toBeInstanceOf(DuplicateError);
    });

    it('calls getSha1 for node_modules files when retainAllFiles and computeSha1 are true', async () => {
      const hasteMap = createEmptyMap();
      const nmPath = `${ROOT}/node_modules/pkg/index.js`;
      const relPath = 'node_modules/pkg/index.js';
      hasteMap.files.set(relPath, ['', 1000, 42, 0, '', null]);

      const worker = makeWorker({sha1: 'abc123'});
      const pool = new MockWorkerPool({maxWorkers: 1});
      (pool.get as jest.Mock).mockReturnValue(worker);

      const fp = new FileProcessor(
        makeOptions({computeSha1: true, retainAllFiles: true}),
        console,
        pool,
      );
      await fp.processFile(hasteMap, hasteMap.map, hasteMap.mocks, nmPath);

      expect(worker.getSha1).toHaveBeenCalledTimes(1);
      expect(worker.worker).not.toHaveBeenCalled();
    });

    it('returns null for a visited file with no ID', () => {
      const hasteMap = createEmptyMap();
      hasteMap.files.set('src/NoId.js', ['', 1000, 42, 1, '', null]);

      const pool = new MockWorkerPool({maxWorkers: 1});
      (pool.get as jest.Mock).mockReturnValue(makeWorker());

      const fp = new FileProcessor(makeOptions(), console, pool);
      const result = fp.processFile(
        hasteMap,
        hasteMap.map,
        hasteMap.mocks,
        `${ROOT}/src/NoId.js`,
      );
      expect(result).toBeNull();
    });
  });

  describe('buildHasteMap', () => {
    it('processes all files when removedFiles is non-empty', async () => {
      const hasteMap = createEmptyMap();
      hasteMap.files.set('src/A.js', ['', 1000, 42, 0, '', null]);
      hasteMap.files.set('src/B.js', ['', 2000, 42, 0, '', null]);

      const pool = new MockWorkerPool({maxWorkers: 1});
      const worker = makeWorker({
        dependencies: [],
        id: '',
        module: null,
        sha1: null,
      });
      (pool.get as jest.Mock).mockReturnValue(worker);

      const fp = new FileProcessor(makeOptions(), console, pool);
      const removedFiles = new Map([
        ['src/Old.js', ['OldModule', 999, 42, 1, '', null] as any],
      ]);

      await fp.buildHasteMap(
        {changedFiles: undefined, hasteMap, removedFiles},
        jest.fn(),
      );

      expect(worker.worker).toHaveBeenCalledTimes(2);
    });

    it('calls recoverDuplicates for each removed file', async () => {
      const hasteMap = createEmptyMap();
      const pool = new MockWorkerPool({maxWorkers: 1});
      (pool.get as jest.Mock).mockReturnValue(makeWorker());

      const fp = new FileProcessor(makeOptions(), console, pool);
      const recoverDuplicates = jest.fn();
      const removedFiles = new Map([
        ['src/Old.js', ['OldModule', 999, 42, 1, '', null] as any],
      ]);

      await fp.buildHasteMap(
        {changedFiles: new Map(), hasteMap, removedFiles},
        recoverDuplicates,
      );

      expect(recoverDuplicates).toHaveBeenCalledWith(
        hasteMap,
        'src/Old.js',
        'OldModule',
      );
    });

    it('calls workerPool.end() after processing', async () => {
      const hasteMap = createEmptyMap();
      const mockEnd = jest.fn();
      const pool = new MockWorkerPool({maxWorkers: 1});
      (pool.get as jest.Mock).mockReturnValue(makeWorker());
      (pool.end as jest.Mock) = mockEnd;

      const fp = new FileProcessor(makeOptions(), console, pool);
      await fp.buildHasteMap(
        {changedFiles: new Map(), hasteMap, removedFiles: new Map()},
        jest.fn(),
      );

      expect(mockEnd).toHaveBeenCalledTimes(1);
    });
  });
});
