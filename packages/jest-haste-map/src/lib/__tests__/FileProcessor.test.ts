/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import type {WorkerMetadata} from '../../types';
import type * as WorkerModule from '../../worker';
import {DuplicateError, FileProcessor} from '../FileProcessor';
import {WorkerPool} from '../WorkerPool';
import {createEmptyMap} from '../util';

jest.mock('../WorkerPool');

const MockWorkerPool = WorkerPool as jest.MockedClass<typeof WorkerPool>;

const ROOT = path.join('/', 'root');
const FAKE_WORKER_PATH = '/fake/worker.js';

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

function makeWorker(reply: Partial<WorkerMetadata> = {}) {
  const fullReply: WorkerMetadata = {
    dependencies: reply.dependencies ?? null,
    id: reply.id ?? null,
    module: reply.module ?? null,
    sha1: reply.sha1 ?? null,
  };
  return {
    getSha1: jest
      .fn<typeof WorkerModule.getSha1>()
      .mockResolvedValue(fullReply),
    worker: jest.fn<typeof WorkerModule.worker>().mockResolvedValue(fullReply),
  };
}

describe('FileProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('processFile', () => {
    it('throws when the file is not in the haste map', () => {
      const pool = new MockWorkerPool({
        maxWorkers: 1,
        workerPath: FAKE_WORKER_PATH,
      });
      jest.mocked(pool.get).mockReturnValue(makeWorker());
      const fp = new FileProcessor(makeOptions(), console, pool);
      const hasteMap = createEmptyMap();

      expect(() =>
        fp.processFile(
          hasteMap,
          hasteMap.map,
          hasteMap.mocks,
          path.join(ROOT, 'missing.js'),
        ),
      ).toThrow('File to process was not found');
    });

    it('calls the worker and updates file metadata on success', async () => {
      const hasteMap = createEmptyMap();
      hasteMap.files.set(path.join('src', 'Apple.js'), [
        '',
        1000,
        42,
        0,
        '',
        null,
      ]);

      const worker = makeWorker({
        dependencies: ['React'],
        id: 'Apple',
        module: [path.join('src', 'Apple.js'), 0],
        sha1: null,
      });
      const pool = new MockWorkerPool({
        maxWorkers: 1,
        workerPath: FAKE_WORKER_PATH,
      });
      jest.mocked(pool.get).mockReturnValue(worker);

      const fp = new FileProcessor(makeOptions(), console, pool);
      await fp.processFile(
        hasteMap,
        hasteMap.map,
        hasteMap.mocks,
        path.join(ROOT, 'src', 'Apple.js'),
      );

      expect(worker.worker).toHaveBeenCalledTimes(1);
      expect(hasteMap.files.get(path.join('src', 'Apple.js'))?.[0]).toBe(
        'Apple',
      );
    });

    it('silently removes the file on ENOENT worker error', async () => {
      const hasteMap = createEmptyMap();
      hasteMap.files.set(path.join('src', 'Gone.js'), [
        '',
        1000,
        42,
        0,
        '',
        null,
      ]);

      const enoent = Object.assign(new Error('ENOENT'), {code: 'ENOENT'});
      const worker = {
        getSha1: jest.fn<typeof WorkerModule.getSha1>(),
        worker: jest.fn<typeof WorkerModule.worker>().mockRejectedValue(enoent),
      };
      const pool = new MockWorkerPool({
        maxWorkers: 1,
        workerPath: FAKE_WORKER_PATH,
      });
      jest.mocked(pool.get).mockReturnValue(worker);

      const fp = new FileProcessor(makeOptions(), console, pool);
      await fp.processFile(
        hasteMap,
        hasteMap.map,
        hasteMap.mocks,
        path.join(ROOT, 'src', 'Gone.js'),
      );

      expect(hasteMap.files.has(path.join('src', 'Gone.js'))).toBe(false);
    });

    it('throws DuplicateError when throwOnModuleCollision is true', async () => {
      const hasteMap = createEmptyMap();
      hasteMap.files.set(path.join('src', 'A.js'), ['', 1000, 42, 0, '', null]);
      hasteMap.map.set('Apple', {g: [path.join('src', 'existing', 'A.js'), 0]});

      const worker = makeWorker({
        dependencies: [],
        id: 'Apple',
        module: [path.join('src', 'A.js'), 0],
        sha1: null,
      });
      const pool = new MockWorkerPool({
        maxWorkers: 1,
        workerPath: FAKE_WORKER_PATH,
      });
      jest.mocked(pool.get).mockReturnValue(worker);

      jest.spyOn(console, 'error').mockImplementation(() => {});
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
          path.join(ROOT, 'src', 'A.js'),
        ),
      ).rejects.toBeInstanceOf(DuplicateError);
    });

    it('preserves sibling platform entry when only one platform collides', async () => {
      const hasteMap = createEmptyMap();
      // File with .ios.js suffix → platform ios
      hasteMap.files.set(path.join('src', 'A.ios.js'), [
        '',
        1000,
        42,
        0,
        '',
        null,
      ]);
      // Apple already has two platform entries: generic (g) and ios.
      hasteMap.map.set('Apple', {
        g: [path.join('src', 'A.js'), 0],
        ios: [path.join('src', 'existing.ios.js'), 0],
      });

      const worker = makeWorker({
        dependencies: [],
        id: 'Apple',
        // Module path has .ios.js suffix → getPlatformExtension returns 'ios'
        module: [path.join('src', 'A.ios.js'), 0],
        sha1: null,
      });
      const pool = new MockWorkerPool({
        maxWorkers: 1,
        workerPath: FAKE_WORKER_PATH,
      });
      jest.mocked(pool.get).mockReturnValue(worker);

      jest.spyOn(console, 'warn').mockImplementation(() => {});
      const fp = new FileProcessor(makeOptions(), console, pool);
      await fp.processFile(
        hasteMap,
        hasteMap.map,
        hasteMap.mocks,
        path.join(ROOT, 'src', 'A.ios.js'),
      );

      // The generic (g) entry must survive even though ios collided.
      expect(hasteMap.map.get('Apple')).toMatchObject({
        g: [path.join('src', 'A.js'), 0],
      });
    });

    it('calls getSha1 for node_modules files when retainAllFiles and computeSha1 are true', async () => {
      const hasteMap = createEmptyMap();
      const nmPath = path.join(ROOT, 'node_modules', 'pkg', 'index.js');
      const relPath = path.join('node_modules', 'pkg', 'index.js');
      hasteMap.files.set(relPath, ['', 1000, 42, 0, '', null]);

      const worker = makeWorker({sha1: 'abc123'});
      const pool = new MockWorkerPool({
        maxWorkers: 1,
        workerPath: FAKE_WORKER_PATH,
      });
      jest.mocked(pool.get).mockReturnValue(worker);

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
      hasteMap.files.set(path.join('src', 'NoId.js'), [
        '',
        1000,
        42,
        1,
        '',
        null,
      ]);

      const pool = new MockWorkerPool({
        maxWorkers: 1,
        workerPath: FAKE_WORKER_PATH,
      });
      jest.mocked(pool.get).mockReturnValue(makeWorker());

      const fp = new FileProcessor(makeOptions(), console, pool);
      const result = fp.processFile(
        hasteMap,
        hasteMap.map,
        hasteMap.mocks,
        path.join(ROOT, 'src', 'NoId.js'),
      );
      expect(result).toBeNull();
    });
  });

  describe('buildHasteMap', () => {
    it('processes all files when removedFiles is non-empty', async () => {
      const hasteMap = createEmptyMap();
      hasteMap.files.set('src/A.js', ['', 1000, 42, 0, '', null]);
      hasteMap.files.set('src/B.js', ['', 2000, 42, 0, '', null]);

      const pool = new MockWorkerPool({
        maxWorkers: 1,
        workerPath: FAKE_WORKER_PATH,
      });
      const worker = makeWorker({
        dependencies: [],
        id: '',
        module: null,
        sha1: null,
      });
      jest.mocked(pool.get).mockReturnValue(worker);

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
      const pool = new MockWorkerPool({
        maxWorkers: 1,
        workerPath: FAKE_WORKER_PATH,
      });
      jest.mocked(pool.get).mockReturnValue(makeWorker());

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
      const pool = new MockWorkerPool({
        maxWorkers: 1,
        workerPath: FAKE_WORKER_PATH,
      });
      jest.mocked(pool.get).mockReturnValue(makeWorker());

      const fp = new FileProcessor(makeOptions(), console, pool);
      await fp.buildHasteMap(
        {changedFiles: new Map(), hasteMap, removedFiles: new Map()},
        jest.fn(),
      );

      expect(pool.end).toHaveBeenCalledTimes(1);
    });
  });
});
