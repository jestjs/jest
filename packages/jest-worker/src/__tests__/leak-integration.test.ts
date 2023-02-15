/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import {join} from 'path';
import {writeFileSync} from 'graceful-fs';
import LeakDetector from 'jest-leak-detector';
import {JestWorkerFarm, Worker} from '../../build';

describe('WorkerThreads leaks', () => {
  let workerFile: string;
  beforeAll(() => {
    workerFile = join(tmpdir(), 'baz.js');
    writeFileSync(workerFile, 'module.exports.fn = () => {};');
  });

  let worker: JestWorkerFarm<{fn(a: unknown): void}>;
  beforeEach(() => {
    worker = new Worker(workerFile, {
      enableWorkerThreads: true,
      exposedMethods: ['fn'],
    }) as JestWorkerFarm<{fn(a: unknown): void}>;
  });
  afterEach(async () => {
    await worker.end();
  });

  it('does not retain arguments after a task finished', async () => {
    let leakDetector: LeakDetector;
    await new Promise((resolve, reject) => {
      const obj = {};
      leakDetector = new LeakDetector(obj);
      worker.fn(obj).then(resolve, reject);
    });

    expect(await leakDetector!.isLeaking()).toBe(false);
  });
});

describe('Worker leaks', () => {
  let workerFile!: string;
  beforeAll(() => {
    workerFile = join(tmpdir(), 'baz.js');
    writeFileSync(workerFile, 'module.exports.fn = (obj) => [obj];');
  });

  let worker: JestWorkerFarm<{fn(a: unknown): void}>;
  beforeEach(() => {
    worker = new Worker(workerFile, {
      enableWorkerThreads: false,
      exposedMethods: ['fn'],
      forkOptions: {serialization: 'json'},
    }) as JestWorkerFarm<{fn(a: unknown): void}>;
  });
  afterEach(async () => {
    await worker.end();
  });

  it('does not retain result after next task call', async () => {
    let leakDetector: LeakDetector;
    await new Promise((resolve, reject) => {
      const obj = {};
      worker
        .fn(obj)
        .then((result: unknown) => {
          leakDetector = new LeakDetector(result);
          return result;
        })
        .then(resolve, reject);
    });
    await new Promise((resolve, reject) => {
      const obj = {};
      worker.fn(obj).then(resolve, reject);
    });

    expect(await leakDetector!.isLeaking()).toBe(false);
  });
});
