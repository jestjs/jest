/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {type JestWorkerFarm, Worker} from 'jest-worker';
import {getSha1, worker} from '../worker';

type HasteWorker = typeof import('../worker');

type WorkerPoolOptions = {
  maxWorkers: number;
  workerPath: string;
  workerThreads?: boolean;
};

export class WorkerPool {
  private readonly _options: WorkerPoolOptions;
  private _worker: JestWorkerFarm<HasteWorker> | HasteWorker | null = null;

  constructor(options: WorkerPoolOptions) {
    this._options = options;
  }

  get(forceInBand?: boolean): JestWorkerFarm<HasteWorker> | HasteWorker {
    if (!this._worker) {
      if (forceInBand || this._options.maxWorkers <= 1) {
        this._worker = {getSha1, worker};
      } else {
        this._worker = new Worker(this._options.workerPath, {
          enableWorkerThreads: this._options.workerThreads,
          exposedMethods: ['getSha1', 'worker'],
          forkOptions: {serialization: 'json'},
          maxRetries: 3,
          numWorkers: this._options.maxWorkers,
        }) as JestWorkerFarm<HasteWorker>;
      }
    }
    return this._worker;
  }

  end(): void {
    const workerInstance = this._worker;
    if (workerInstance && 'end' in workerInstance) {
      workerInstance.end();
    }
    this._worker = null;
  }
}
