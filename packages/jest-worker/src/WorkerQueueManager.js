/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import type {
  QueueChildMessage,
  WorkerPoolInterface,
  WorkerInterface,
} from './types';

export default class WorkerQueueManager {
  _workerPool: WorkerPoolInterface;
  _queue: Array<?QueueChildMessage>;
  _last: Array<QueueChildMessage>;
  _locks: Array<boolean>;
  _offset: number;

  constructor(workerPool: WorkerPoolInterface) {
    this._workerPool = workerPool;
    this._queue = [];
    this._last = [];
    this._locks = [];
    this._offset = 0;

    // If we exceeded the amount of retries, we will emulate an error reply
    // coming from the child. This avoids code duplication related with cleaning
    // the queue, and scheduling the next call.

    // if (this._retries > this._options.maxRetries) {
    //   const error = new Error('Call retries were exceeded');

    //   this.onMessage([
    //     PARENT_MESSAGE_ERROR,
    //     error.name,
    //     error.message,
    //     error.stack,
    //     {type: 'WorkerError'},
    //   ]);
    // }
  }

  enqueue(task: QueueChildMessage, workerId?: number): WorkerQueueManager {
    if (workerId != null) {
      if (this._queue[workerId]) {
        this._last[workerId].next = task;
        this._last[workerId] = task;
      } else {
        this._queue[workerId] = task;
        this._last[workerId] = task;
      }

      this.run(workerId);
    } else {
      const numOfWorkers = this._workerPool.getWorkers().length;
      for (let i = 0; i < numOfWorkers; i++) {
        const workerIdx = (this._offset + i) % numOfWorkers;
        this.enqueue(task, workerIdx);
      }
      this._offset++;
    }

    return this;
  }

  run(workerId: number): WorkerQueueManager {
    if (this.isLocked(workerId)) {
      return this;
    }

    const job = this._queue[workerId];
    const worker = this._workerPool.getWorkers()[workerId];

    if (!job) {
      return this;
    }

    if (job.owner) {
      this._queue[workerId] = job.next ? job.next : null;
      return this.run(workerId);
    }

    if (!worker) {
      throw Error(`Worker with ID "${workerId}" is not found`);
    }

    const onEnd = (error: ?Error, result: mixed, worker: WorkerInterface) => {
      this.unlock(workerId);
      job.onEnd(error, result, worker);
      this.run(workerId);
    };

    this.lock(workerId);

    this._workerPool.send(worker, job.request, job.onStart, onEnd);

    job.owner = worker;

    return this;
  }

  lock(workerId: number): void {
    this._locks[workerId] = true;
  }

  unlock(workerId: number): void {
    this._locks[workerId] = false;
  }

  isLocked(workerId: number): boolean {
    return this._locks[workerId];
  }
}
