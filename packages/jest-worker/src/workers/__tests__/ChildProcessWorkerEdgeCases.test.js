/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {rm, writeFile} from 'fs/promises';
import {join} from 'path';
import {transformFileAsync} from '@babel/core';
import {CHILD_MESSAGE_CALL, CHILD_MESSAGE_MEM_USAGE} from '../../types';
import ChildProcessWorker from '../ChildProcessWorker';

jest.retryTimes(1);

/** @type ChildProcessWorker */
let worker;
let int;

const filesToBuild = ['../processChild', '../../types'];

beforeAll(async () => {
  for (const file of filesToBuild) {
    const result = await transformFileAsync(join(__dirname, `${file}.ts`));

    await writeFile(join(__dirname, `${file}.js`), result.code, {
      encoding: 'utf-8',
    });
  }
});

afterAll(async () => {
  for (const file of filesToBuild) {
    await rm(join(__dirname, `${file}.js`));
  }
});

beforeEach(() => {});

afterEach(async () => {
  if (worker) {
    worker.forceExit();
    await worker.waitForExit();
  }

  clearInterval(int);
});

function waitForChange(fn, limit = 100) {
  const inital = fn();

  return new Promise((resolve, reject) => {
    let count = 0;
    const int = setInterval(() => {
      const updated = fn();

      if (inital !== updated) {
        resolve(updated);
        clearInterval(int);
      }

      if (count > limit) {
        reject(new Error('Timeout waiting for change'));
      }

      count++;
    }, 50);
  });
}

test('should get memory usage', async () => {
  console.log(1);

  worker = new ChildProcessWorker({
    maxRetries: 0,
    workerPath: join(
      __dirname,
      '__fixtures__',
      'ChildProcessWorkerEdgeCasesWorker',
    ),
  });

  console.log(2, worker);

  const memoryUsagePromise = worker.getMemoryUsage();
  expect(memoryUsagePromise).toBeInstanceOf(Promise);

  console.log(3, memoryUsagePromise);
  expect(await memoryUsagePromise).toBeGreaterThan(0);
  console.log(4, memoryUsagePromise);
}, 10000);

test('should recycle on idle limit breach', async () => {
  worker = new ChildProcessWorker({
    // There is no way this is fitting into 1000 bytes, so it should restart
    // after requesting a memory usage update
    idleMemoryLimit: 1000,
    maxRetries: 0,
    workerPath: join(
      __dirname,
      '__fixtures__',
      'ChildProcessWorkerEdgeCasesWorker',
    ),
  });

  const startPid = worker.getWorkerPid();
  expect(startPid).toBeGreaterThanOrEqual(0);

  worker.checkMemoryUsage();

  await waitForChange(() => worker.getWorkerPid());

  const endPid = worker.getWorkerPid();
  expect(endPid).toBeGreaterThanOrEqual(0);
  expect(endPid).not.toEqual(startPid);
}, 10000);

test('should automatically recycle on idle limit breach', async () => {
  worker = new ChildProcessWorker({
    // There is no way this is fitting into 1000 bytes, so it should restart
    // after requesting a memory usage update
    idleMemoryLimit: 1000,
    maxRetries: 0,
    workerPath: join(
      __dirname,
      '__fixtures__',
      'ChildProcessWorkerEdgeCasesWorker',
    ),
  });

  const startPid = worker.getWorkerPid();
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

  await waitForChange(() => worker.getWorkerPid());

  const endPid = worker.getWorkerPid();
  expect(endPid).toBeGreaterThanOrEqual(0);
  expect(endPid).not.toEqual(startPid);
}, 10000);

test('should cleanly exit on crash', async () => {
  worker = new ChildProcessWorker({
    forkOptions: {
      // Forcibly set the heap limit so we can crash the process easily.
      execArgv: ['--max-old-space-size=50'],
    },
    maxRetries: 0,
    workerPath: join(
      __dirname,
      '__fixtures__',
      'ChildProcessWorkerEdgeCasesWorker',
    ),
  });

  const startPid = worker.getWorkerPid();
  expect(startPid).toBeGreaterThanOrEqual(0);

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
}, 30000);
