/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {access, mkdir, rm, writeFile} from 'fs/promises';
import {dirname, join} from 'path';
import {transformFileAsync} from '@babel/core';
import {
  CHILD_MESSAGE_CALL,
  CHILD_MESSAGE_MEM_USAGE,
  WorkerInterface,
  WorkerOptions,
} from '../../types';
import ChildProcessWorker from '../ChildProcessWorker';
import ThreadsWorker from '../NodeThreadsWorker';

// These tests appear to be slow/flaky. Allowing it to retry quite a few times
// will cut down on this noise and they're fast tests anyway.
jest.retryTimes(30);

const root = join('../../');
const filesToBuild = ['workers/processChild', 'workers/threadChild', 'types'];
const writeDestination = join(__dirname, '__temp__');
const processChildWorkerPath = join(
  writeDestination,
  'workers/processChild.js',
);
const threadChildWorkerPath = join(writeDestination, 'workers/threadChild.js');

beforeAll(async () => {
  await mkdir(writeDestination, {recursive: true});

  for (const file of filesToBuild) {
    const sourcePath = join(__dirname, root, `${file}.ts`);
    const writePath = join(writeDestination, `${file}.js`);

    await mkdir(dirname(writePath), {recursive: true});

    const result = await transformFileAsync(sourcePath);

    await writeFile(writePath, result.code, {
      encoding: 'utf-8',
    });
  }
});

afterAll(async () => {
  await rm(writeDestination, {force: true, recursive: true});
});

test.each(filesToBuild)('%s.js should exist', async file => {
  const path = join(writeDestination, `${file}.js`);

  await expect(async () => await access(path)).not.toThrowError();
});

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
  /** @type WorkerInterface */
  let worker;
  let int;

  afterEach(async () => {
    if (worker) {
      worker.forceExit();
      await worker.waitForExit();
    }

    clearInterval(int);
  });

  function waitForChange(fn) {
    const inital = fn();

    return new Promise((resolve, reject) => {
      let count = 0;

      int = setInterval(() => {
        const updated = fn();

        if (inital !== updated) {
          resolve(updated);
          clearInterval(int);
        }

        if (count > 100000) {
          reject(new Error('Timeout waiting for change'));
        }

        count++;
      }, 1);
    });
  }

  test('should get memory usage', async () => {
    worker = new workerClass({
      childWorkerPath: workerPath,
      maxRetries: 0,
      workerPath: join(__dirname, '__fixtures__', 'EdgeCasesWorker'),
    });

    const memoryUsagePromise = worker.getMemoryUsage();
    expect(memoryUsagePromise).toBeInstanceOf(Promise);

    expect(await memoryUsagePromise).toBeGreaterThan(0);
  });

  test('should recycle on idle limit breach', async () => {
    worker = new workerClass({
      childWorkerPath: workerPath,
      // There is no way this is fitting into 1000 bytes, so it should restart
      // after requesting a memory usage update
      idleMemoryLimit: 1000,
      maxRetries: 0,
      workerPath: join(__dirname, '__fixtures__', 'EdgeCasesWorker'),
    });

    const startSystemId = worker.getWorkerSystemId();
    expect(startSystemId).toBeGreaterThanOrEqual(0);

    worker.checkMemoryUsage();

    await waitForChange(() => worker.getWorkerSystemId());

    const systemId = worker.getWorkerSystemId();
    expect(systemId).toBeGreaterThanOrEqual(0);
    expect(systemId).not.toEqual(startSystemId);
  });

  test('should automatically recycle on idle limit breach', async () => {
    worker = new workerClass({
      childWorkerPath: workerPath,
      // There is no way this is fitting into 1000 bytes, so it should restart
      // after requesting a memory usage update
      idleMemoryLimit: 1000,
      maxRetries: 0,
      workerPath: join(__dirname, '__fixtures__', 'EdgeCasesWorker'),
    });

    const startPid = worker.getWorkerSystemId();
    expect(startPid).toBeGreaterThanOrEqual(0);

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
  }, 10000);

  test('should cleanly exit on crash', async () => {
    const workerHeapLimit = 10;

    /** @type WorkerOptions */
    const options = {
      childWorkerPath: workerPath,
      maxRetries: 0,
      silent: true,
      workerPath: join(__dirname, '__fixtures__', 'EdgeCasesWorker'),
    };

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

    const pid = worker.getWorkerSystemId();
    expect(pid).toBeGreaterThanOrEqual(0);

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
  }, 15000);

  test('should handle regular fatal crashes', async () => {
    worker = new workerClass({
      childWorkerPath: workerPath,
      maxRetries: 4,
      workerPath: join(__dirname, '__fixtures__', 'EdgeCasesWorker'),
    });

    const startPid = worker.getWorkerSystemId();
    expect(startPid).toBeGreaterThanOrEqual(0);

    const onStart = jest.fn();
    const onEnd = jest.fn();
    const onCustom = jest.fn();

    worker.send(
      [CHILD_MESSAGE_CALL, true, 'fatalExitCode', []],
      onStart,
      onEnd,
      onCustom,
    );

    let pidChanges = 0;

    while (true) {
      // Ideally this would use Promise.any but it's not supported in Node 14
      // so doing this instead. Essentially what we're doing is looping and
      // capturing the pid every time it changes. When it stops changing the
      // timeout will be hit and we should be left with a collection of all
      // the pids used by the worker.
      const newPid = await new Promise(resolve => {
        const resolved = false;

        const to = setTimeout(() => {
          if (!resolved) {
            this.resolved = true;
            resolve(undefined);
          }
        }, 500);

        waitForChange(() => worker.getWorkerSystemId()).then(() => {
          clearTimeout(to);

          if (!resolved) {
            resolve(worker.getWorkerSystemId());
          }
        });
      });

      if (typeof newPid === 'number') {
        pidChanges++;
      } else {
        break;
      }
    }

    // Expect the pids to be retries + 1 because it is restarted
    // one last time at the end ready for the next request.
    expect(pidChanges).toEqual(5);

    worker.forceExit();
  });
});
