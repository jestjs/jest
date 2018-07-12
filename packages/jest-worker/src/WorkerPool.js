/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import BaseWorkerPool from './base/BaseWorkerPool';
import ChildProcessWorker from './workers/ChildProcessWorker';
import NodeThreadsWorker from './workers/NodeThreadsWorker';

import type {
  ChildMessage,
  WorkerOptions,
  OnStart,
  OnEnd,
  WorkerPoolInterface,
  WorkerInterface,
} from './types';

class WorkerPool extends BaseWorkerPool implements WorkerPoolInterface {
  send(
    workerId: number,
    request: ChildMessage,
    onStart: OnStart,
    onEnd: OnEnd,
  ): void {
    this.getWorkerById(workerId).send(request, onStart, onEnd);
  }

  createWorker(workerOptions: WorkerOptions): WorkerInterface {
    return this._options.useWorkers
      ? new NodeThreadsWorker(workerOptions)
      : new ChildProcessWorker(workerOptions);
  }
}

export default WorkerPool;
