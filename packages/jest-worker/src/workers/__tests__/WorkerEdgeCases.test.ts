/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {access, mkdir, rm, writeFile} from 'fs/promises';
import {dirname, join} from 'path';
import {transformFileAsync} from '@babel/core';
import {
  CHILD_MESSAGE_CALL,
  WorkerEvents,
  type WorkerOptions,
  WorkerStates,
} from '../../types';
import ChildProcessWorker, {SIGKILL_DELAY} from '../ChildProcessWorker';
import ThreadsWorker from '../NodeThreadsWorker';

jest.setTimeout(10_000);

const root = join('../../');
const filesToBuild = ['workers/processChild', 'workers/threadChild', 'types'];
const writeDestination = join(__dirname, '__temp__');
const processChildWorkerPath = join(
  writeDestination,
  'workers/processChild.js',
);
const threadChildWorkerPath = join(writeDestination, 'workers/threadChild.js');

// https://github.com/nodejs/node/issues/51766
if (
  process.platform === 'win32' &&
  (process.version.startsWith('v21.') ||
    process.version.startsWith('v22.') ||
    process.version.startsWith('v23.'))
) {
  // eslint-disable-next-line jest/no-focused-tests
  test.only('skipping test on broken platform', () => {
    console.warn('Skipping test on broken platform');
  });
}

beforeAll(async () => {
  await mkdir(writeDestination, {recursive: true});

  for (const file of filesToBuild) {
    const sourcePath = join(__dirname, root, `${file}.ts`);
    const writePath = join(writeDestination, `${file}.js`);

    await mkdir(dirname(writePath), {recursive: true});

    const result = await transformFileAsync(sourcePath);

    await writeFile(writePath, result!.code!, 'utf8');
  }
});

afterAll(async () => {
  await rm(writeDestination, {force: true, recursive: true});
});

test.each(filesToBuild)('%s.js should exist', file => {
  const path = join(writeDestination, `${file}.js`);

  expect(async () => access(path)).not.toThrow();
});

async function closeWorkerAfter(
  worker: ChildProcessWorker | ThreadsWorker,
  testBody: (worker: ChildProcessWorker | ThreadsWorker) => Promise<void>,
) {
  try {
    await testBody(worker);
  } finally {
    worker.forceExit();
    await worker.waitForExit();
  }
}

describe.each([
  {
    name: 'ProcessWorker',
    workerClass: ChildProcessWorker,
    workerPath: processChildWorkerPath,
  },
  {
    name: 'ThreadWorker',
    workerClass: ThreadsWorker,
    workerPath: threadChildWorkerPath,
  },
])('$name', ({workerClass, workerPath}) => {
  let int: NodeJS.Timeout;

  afterEach(async () => {
    clearInterval(int);
  });

  function waitForChange(fn: () => unknown) {
    const initial = fn();

    return new Promise((resolve, reject) => {
      let count = 0;

      int = setInterval(() => {
        const updated = fn();

        if (initial !== updated) {
          resolve(updated);
          clearInterval(int);
        }

        if (count > 100_000) {
          reject(new Error('Timeout waiting for change'));
        }

        count++;
      }, 1);
    });
  }

  test('should get memory usage', async () => {
    await closeWorkerAfter(
      new workerClass({
        childWorkerPath: workerPath,
        maxRetries: 0,
        workerPath: join(__dirname, '__fixtures__', 'EdgeCasesWorker'),
      } as WorkerOptions),
      async (worker: ChildProcessWorker | ThreadsWorker) => {
        const memoryUsagePromise = worker.getMemoryUsage();
        expect(memoryUsagePromise).toBeInstanceOf(Promise);

        expect(await memoryUsagePromise).toBeGreaterThan(0);
      },
    );
  });

  test('should recycle on idle limit breach', async () => {
    await closeWorkerAfter(
      new workerClass({
        childWorkerPath: workerPath,
        // There is no way this is fitting into 1000 bytes, so it should restart
        // after requesting a memory usage update
        idleMemoryLimit: 1000,
        maxRetries: 0,
        workerPath: join(__dirname, '__fixtures__', 'EdgeCasesWorker'),
      } as WorkerOptions),
      async (worker: ChildProcessWorker | ThreadsWorker) => {
        const startSystemId = worker.getWorkerSystemId();
        expect(startSystemId).toBeGreaterThanOrEqual(0);

        worker.checkMemoryUsage();

        await waitForChange(() => worker.getWorkerSystemId());

        const systemId = worker.getWorkerSystemId();
        expect(systemId).toBeGreaterThanOrEqual(0);
        expect(systemId).not.toEqual(startSystemId);

        await new Promise(resolve => {
          setTimeout(resolve, SIGKILL_DELAY + 100);
        });

        expect(worker.isWorkerRunning()).toBeTruthy();
      },
    );
  });

  describe('should automatically recycle on idle limit breach', () => {
    let startPid: number;
    let worker: ChildProcessWorker | ThreadsWorker;
    const orderOfEvents: Array<WorkerStates> = [];

    beforeAll(() => {
      worker = new workerClass({
        childWorkerPath: workerPath,
        // There is no way this is fitting into 1000 bytes, so it should restart
        // after requesting a memory usage update
        idleMemoryLimit: 1000,
        maxRetries: 0,
        on: {
          [WorkerEvents.STATE_CHANGE]: (state: WorkerStates) => {
            orderOfEvents.push(state);
          },
        },
        silent: true,
        workerPath: join(__dirname, '__fixtures__', 'EdgeCasesWorker'),
      } as unknown as WorkerOptions);
    });

    afterAll(async () => {
      if (worker) {
        worker.forceExit();
        await worker.waitForExit();
      }
    });

    test('initial state', async () => {
      startPid = worker.getWorkerSystemId();
      expect(startPid).toBeGreaterThanOrEqual(0);
      expect(worker.state).toEqual(WorkerStates.OK);

      expect(orderOfEvents).toEqual(['ok']);
    });

    test('new worker starts', async () => {
      const onStart = jest.fn();
      const onEnd = jest.fn();
      const onCustom = jest.fn();

      worker.send(
        [CHILD_MESSAGE_CALL, true, 'safeFunction', []],
        onStart,
        onEnd,
        onCustom,
      );

      await waitForChange(() => worker.getWorkerSystemId());

      const endPid = worker.getWorkerSystemId();
      expect(endPid).toBeGreaterThanOrEqual(0);
      expect(endPid).not.toEqual(startPid);
      expect(worker.isWorkerRunning()).toBeTruthy();
      expect(worker.state).toEqual(WorkerStates.OK);
    });

    test(
      'worker continues to run after kill delay',
      async () => {
        await new Promise(resolve => {
          setTimeout(resolve, SIGKILL_DELAY + 100);
        });

        expect(worker.state).toEqual(WorkerStates.OK);
        expect(worker.isWorkerRunning()).toBeTruthy();
      },
      SIGKILL_DELAY * 3,
    );

    test('expected state order', () => {
      expect(orderOfEvents).toEqual(['ok', 'restarting', 'starting', 'ok']);
    });
  });

  describe('should cleanly exit on out of memory crash', () => {
    const workerHeapLimit = 50;

    let worker: ChildProcessWorker | ThreadsWorker;
    let orderOfEvents: Array<WorkerStates> = [];

    beforeAll(() => {
      orderOfEvents = [];

      const options = {
        childWorkerPath: workerPath,
        maxRetries: 0,
        on: {
          [WorkerEvents.STATE_CHANGE]: (state: WorkerStates) => {
            orderOfEvents.push(state);
          },
        },
        silent: true,
        workerPath: join(__dirname, '__fixtures__', 'EdgeCasesWorker'),
      } as unknown as WorkerOptions;

      if (workerClass === ThreadsWorker) {
        options.resourceLimits = {
          codeRangeSizeMb: workerHeapLimit * 2,
          maxOldGenerationSizeMb: workerHeapLimit,
          maxYoungGenerationSizeMb: workerHeapLimit * 2,
          stackSizeMb: workerHeapLimit * 2,
        };
      } else if (workerClass === ChildProcessWorker) {
        options.forkOptions = {
          // Forcibly set the heap limit so we can crash the process easily.
          execArgv: [`--max-old-space-size=${workerHeapLimit}`],
        };
      }

      worker = new workerClass(options);
    });

    afterAll(async () => {
      await new Promise<void>(resolve => {
        setTimeout(async () => {
          if (worker) {
            worker.forceExit();
            await worker.waitForExit();
          }

          resolve();
        }, 500);
      });
    });

    test('starting state', async () => {
      const startPid = worker.getWorkerSystemId();
      expect(startPid).toBeGreaterThanOrEqual(0);
    });

    test('worker ready', async () => {
      await worker.waitForWorkerReady();
      expect(worker.state).toEqual(WorkerStates.OK);
    });

    test('worker crashes and exits', async () => {
      const onStart = jest.fn();
      const onEnd = jest.fn();
      const onCustom = jest.fn();

      worker.send(
        [CHILD_MESSAGE_CALL, true, 'leakMemory', []],
        onStart,
        onEnd,
        onCustom,
      );

      await worker.waitForExit();

      expect(worker.state).not.toEqual(WorkerStates.OK);
    });

    test('worker stays dead', async () => {
      await expect(async () => worker.waitForWorkerReady()).rejects.toThrow(
        'Worker state means it will never be ready: shut-down',
      );
      expect(worker.isWorkerRunning()).toBeFalsy();
    });

    test('expected state order', () => {
      expect(orderOfEvents).toEqual([
        WorkerStates.OK,
        WorkerStates.OUT_OF_MEMORY,
        WorkerStates.SHUT_DOWN,
      ]);
    });
  });

  describe('should handle regular fatal crashes', () => {
    let worker: ChildProcessWorker | ThreadsWorker;
    let startedWorkers = 0;

    beforeAll(() => {
      worker = new workerClass({
        childWorkerPath: workerPath,
        maxRetries: 4,
        on: {
          [WorkerEvents.STATE_CHANGE]: (state: WorkerStates) => {
            if (state === WorkerStates.OK) {
              startedWorkers++;
            }
          },
        },
        workerPath: join(__dirname, '__fixtures__', 'EdgeCasesWorker'),
      } as unknown as WorkerOptions);
    });

    afterAll(async () => {
      if (worker) {
        worker.forceExit();
        await worker.waitForExit();
      }
    });

    test('starting state', async () => {
      const startPid = worker.getWorkerSystemId();
      expect(startPid).toBeGreaterThanOrEqual(0);
    });

    test('processes restart', async () => {
      const onStart = jest.fn();
      const onEnd = jest.fn();
      const onCustom = jest.fn();

      worker.send(
        [CHILD_MESSAGE_CALL, true, 'fatalExitCode', []],
        onStart,
        onEnd,
        onCustom,
      );

      // Give it some time to restart some workers
      await new Promise(resolve => setTimeout(resolve, 4000));

      expect(startedWorkers).toBe(6);

      expect(worker.isWorkerRunning()).toBeTruthy();
      expect(worker.state).toEqual(WorkerStates.OK);
    });

    test('processes exits', async () => {
      worker.forceExit();

      await expect(() => worker.waitForWorkerReady()).rejects.toThrow(
        'Worker state means it will never be ready: shutting-down',
      );
    });
  });

  describe('should not hang when worker is killed or unexpectedly terminated', () => {
    let worker: ChildProcessWorker | ThreadsWorker;

    beforeEach(() => {
      const options = {
        childWorkerPath: processChildWorkerPath,
        maxRetries: 0,
        silent: true,
        workerPath: join(__dirname, '__fixtures__', 'SelfKillWorker'),
      } as unknown as WorkerOptions;

      worker = new ChildProcessWorker(options);
    });

    afterEach(async () => {
      await new Promise<void>(resolve => {
        setTimeout(async () => {
          if (worker) {
            worker.forceExit();
            await worker.waitForExit();
          }

          resolve();
        }, 500);
      });
    });

    // Regression test for https://github.com/jestjs/jest/issues/13183
    test('onEnd callback is called', async () => {
      let onEndPromiseResolve: () => void;
      let onEndPromiseReject: (err: Error) => void;
      const onEndPromise = new Promise<void>((resolve, reject) => {
        onEndPromiseResolve = resolve;
        onEndPromiseReject = reject;
      });

      const onStart = jest.fn();
      const onEnd = jest.fn((err: Error | null) => {
        if (err) {
          return onEndPromiseReject(err);
        }
        onEndPromiseResolve();
      });
      const onCustom = jest.fn();

      await worker.waitForWorkerReady();

      // The SelfKillWorker simulates an external process calling SIGTERM on it,
      // but just SIGTERMs itself underneath the hood to make this test easier.
      worker.send(
        [CHILD_MESSAGE_CALL, true, 'selfKill', []],
        onStart,
        onEnd,
        onCustom,
      );

      // The onEnd callback should be called when the child process exits.
      await expect(onEndPromise).rejects.toBeInstanceOf(Error);
      expect(onEnd).toHaveBeenCalled();
    });
  });
});
