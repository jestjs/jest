/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {colorLevel} from 'jest-util';
import BaseWorkerPool from './base/BaseWorkerPool';
import type {
  ChildMessage,
  OnCustomMessage,
  OnEnd,
  OnStart,
  WorkerInterface,
  WorkerOptions,
  WorkerPoolInterface,
} from './types';

class WorkerPool extends BaseWorkerPool implements WorkerPoolInterface {
  send(
    workerId: number,
    request: ChildMessage,
    onStart: OnStart,
    onEnd: OnEnd,
    onCustomMessage: OnCustomMessage,
  ): void {
    this.restartWorkerIfShutDown(workerId);
    this.getWorkerById(workerId).send(request, onStart, onEnd, onCustomMessage);
  }

  override createWorker(workerOptions: WorkerOptions): WorkerInterface {
    workerOptions = {...workerOptions};
    workerOptions.forkOptions = {...workerOptions.forkOptions};
    workerOptions.forkOptions.env ??= process.env;
    workerOptions.forkOptions.env = {
      ...workerOptions.forkOptions.env,
      JEST_WORKER_COLOR: String(colorLevel.stdout),
      JEST_WORKER_ID: String(workerOptions.workerId + 1), // 0-indexed workerId, 1-indexed JEST_WORKER_ID
    };

    let Worker;
    if (this._options.enableWorkerThreads) {
      Worker = require('./workers/NodeThreadsWorker').default;
    } else {
      Worker = require('./workers/ChildProcessWorker').default;
    }

    return new Worker(workerOptions);
  }
}

export default WorkerPool;
