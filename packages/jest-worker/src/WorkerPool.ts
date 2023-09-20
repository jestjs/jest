/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
