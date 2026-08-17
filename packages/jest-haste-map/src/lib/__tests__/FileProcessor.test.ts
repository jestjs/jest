/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as os from 'node:os';
import * as path from 'node:path';
import type {WorkerMetadata} from '../../types';
import type * as WorkerModule from '../../worker';
import {DuplicateError, FileProcessor} from '../FileProcessor';
import {WorkerPool} from '../WorkerPool';
import {createEmptyMap} from '../util';

jest.mock('../WorkerPool');
// `isIgnorableFileError` reads the platform once at module load, so the
// platform-dependent cases have to re-import through `jest.isolateModules`.
jest.mock('node:os', () => ({
  ...jest.requireActual<typeof import('node:os')>('node:os'),
  platform: jest.fn(
    jest.requireActual<typeof import('node:os')>('node:os').platform,
  ),
}));

const mockPlatform = jest.mocked(os.platform);
const MockWorkerPool = WorkerPool as jest.MockedClass<typeof WorkerPool>;

function loadFileProcessorOn(platform: NodeJS.Platform) {
  mockPlatform.mockReturnValue(platform);
  let Loaded!: typeof FileProcessor;
  jest.isolateModules(() => {
    ({FileProcessor: Loaded} = require('../FileProcessor'));
  });
  return Loaded;
}

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

    it.each(['EACCES', 'ENOENT'])(
      'silently removes the file on a %s worker error',
      async code => {
        const hasteMap = createEmptyMap();
        hasteMap.files.set(path.join('src', 'Locked.js'), [
          '',
          1000,
          42,
          0,
          '',
          null,
        ]);

        const worker = {
          getSha1: jest.fn<typeof WorkerModule.getSha1>(),
          worker: jest
            .fn<typeof WorkerModule.worker>()
            .mockRejectedValue(Object.assign(new Error(code), {code})),
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
          path.join(ROOT, 'src', 'Locked.js'),
        );

        expect(hasteMap.files.has(path.join('src', 'Locked.js'))).toBe(false);
      },
    );

    // The reason this PR exists: an outside process holding a file open on
    // Windows surfaces as EPERM, and indexing has to survive it. Asserting it
    // here (rather than only on the predicate) is what pins `workerError` to
    // `isIgnorableFileError` — the array check it replaced passes every other
    // case in this file.
    it.each([
      ['win32', false],
      ['linux', true],
    ] as const)(
      'on %s, an EPERM worker error keeps the file: %s',
      async (platform, stillThrows) => {
        const hasteMap = createEmptyMap();
        hasteMap.files.set(path.join('src', 'Held.js'), [
          '',
          1000,
          42,
          0,
          '',
          null,
        ]);

        const worker = {
          getSha1: jest.fn<typeof WorkerModule.getSha1>(),
          worker: jest
            .fn<typeof WorkerModule.worker>()
            .mockRejectedValue(
              Object.assign(new Error('EPERM'), {code: 'EPERM'}),
            ),
        };
        const pool = new MockWorkerPool({
          maxWorkers: 1,
          workerPath: FAKE_WORKER_PATH,
        });
        jest.mocked(pool.get).mockReturnValue(worker);

        const PlatformFileProcessor = loadFileProcessorOn(platform);
        const fp = new PlatformFileProcessor(makeOptions(), console, pool);
        const processing = fp.processFile(
          hasteMap,
          hasteMap.map,
          hasteMap.mocks,
          path.join(ROOT, 'src', 'Held.js'),
        );

        if (stillThrows) {
          await expect(processing).rejects.toThrow('EPERM');
        } else {
          await processing;
          expect(hasteMap.files.has(path.join('src', 'Held.js'))).toBe(false);
        }
      },
    );

    it('rethrows a worker error that is not an ignorable file error', async () => {
      const hasteMap = createEmptyMap();
      hasteMap.files.set(path.join('src', 'Bad.js'), [
        '',
        1000,
        42,
        0,
        '',
        null,
      ]);

      const worker = {
        getSha1: jest.fn<typeof WorkerModule.getSha1>(),
        worker: jest
          .fn<typeof WorkerModule.worker>()
          .mockRejectedValue(
            Object.assign(new Error('EISDIR'), {code: 'EISDIR'}),
          ),
      };
      const pool = new MockWorkerPool({
        maxWorkers: 1,
        workerPath: FAKE_WORKER_PATH,
      });
      jest.mocked(pool.get).mockReturnValue(worker);

      const fp = new FileProcessor(makeOptions(), console, pool);

      await expect(
        fp.processFile(
          hasteMap,
          hasteMap.map,
          hasteMap.mocks,
          path.join(ROOT, 'src', 'Bad.js'),
        ),
      ).rejects.toThrow('EISDIR');
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

    it('does not re-run the worker for a visited file whose ID is a known duplicate', () => {
      const relativeFilePath = path.join('src', 'Dup.js');
      const hasteMap = createEmptyMap();
      hasteMap.files.set(relativeFilePath, ['Dup', 1000, 42, 1, '', null]);
      // A collided name is removed from `map` and recorded in `duplicates`.
      hasteMap.duplicates.set(
        'Dup',
        new Map([
          [
            'g',
            new Map([
              [relativeFilePath, 0],
              [path.join('other', 'Dup.js'), 0],
            ]),
          ],
        ]),
      );

      const pool = new MockWorkerPool({
        maxWorkers: 1,
        workerPath: FAKE_WORKER_PATH,
      });
      const workerInstance = makeWorker();
      jest.mocked(pool.get).mockReturnValue(workerInstance);

      const fp = new FileProcessor(makeOptions(), console, pool);
      const result = fp.processFile(
        hasteMap,
        new Map(),
        hasteMap.mocks,
        path.join(ROOT, relativeFilePath),
      );

      expect(result).toBeNull();
      expect(workerInstance.worker).not.toHaveBeenCalled();
    });

    it('still runs the worker for a visited file absent from the duplicates set', () => {
      const hasteMap = createEmptyMap();
      hasteMap.files.set(path.join('src', 'Dup.js'), [
        'Dup',
        1000,
        42,
        1,
        '',
        null,
      ]);
      hasteMap.duplicates.set(
        'Dup',
        new Map([['g', new Map([[path.join('other', 'Dup.js'), 0]])]]),
      );

      const pool = new MockWorkerPool({
        maxWorkers: 1,
        workerPath: FAKE_WORKER_PATH,
      });
      const workerInstance = makeWorker();
      jest.mocked(pool.get).mockReturnValue(workerInstance);

      const fp = new FileProcessor(makeOptions(), console, pool);
      fp.processFile(
        hasteMap,
        new Map(),
        hasteMap.mocks,
        path.join(ROOT, 'src', 'Dup.js'),
      );

      expect(workerInstance.worker).toHaveBeenCalledTimes(1);
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

    it('ends the worker pool when a duplicate mock throws synchronously', () => {
      const hasteMap = createEmptyMap();
      hasteMap.files.set(path.join('__mocks__', 'a.js'), [
        '',
        1000,
        42,
        0,
        '',
        null,
      ]);
      hasteMap.files.set(path.join('nested', '__mocks__', 'a.js'), [
        '',
        2000,
        42,
        0,
        '',
        null,
      ]);

      const pool = new MockWorkerPool({
        maxWorkers: 1,
        workerPath: FAKE_WORKER_PATH,
      });
      jest.mocked(pool.get).mockReturnValue(makeWorker());
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const fp = new FileProcessor(
        makeOptions({
          mocksPattern: /__mocks__/,
          throwOnModuleCollision: true,
        }),
        console,
        pool,
      );

      expect(() =>
        fp.buildHasteMap({hasteMap, removedFiles: new Map()}, jest.fn()),
      ).toThrow(DuplicateError);
      expect(pool.end).toHaveBeenCalledTimes(1);
    });
  });
});
