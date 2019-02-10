/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  ChildMessage,
  FarmOptions,
  QueueChildMessage,
  WorkerInterface,
  OnStart,
  OnEnd,
  CHILD_MESSAGE_CALL,
} from './types';

export default class Farm {
  _computeWorkerKey: FarmOptions['computeWorkerKey'];
  _cacheKeys: {[key: string]: WorkerInterface};
  _callback: Function;
  _last: Array<QueueChildMessage>;
  _locks: Array<boolean>;
  _numOfWorkers: number;
  _offset: number;
  _queue: Array<QueueChildMessage | null>;

  constructor(
    numOfWorkers: number,
    callback: Function,
    computeWorkerKey?: FarmOptions['computeWorkerKey'],
  ) {
    this._callback = callback;
    this._numOfWorkers = numOfWorkers;
    this._cacheKeys = Object.create(null);
    this._queue = [];
    this._last = [];
    this._locks = [];
    this._offset = 0;
    if (computeWorkerKey) {
      this._computeWorkerKey = computeWorkerKey;
    }
  }

  doWork(method: string, ...args: Array<any>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const computeWorkerKey = this._computeWorkerKey;
      const request: ChildMessage = [CHILD_MESSAGE_CALL, false, method, args];

      let worker: WorkerInterface | null = null;
      let hash: string | null = null;

      if (computeWorkerKey) {
        hash = computeWorkerKey.call(this, method, ...args);
        worker = hash == null ? null : this._cacheKeys[hash];
      }

      const onStart: OnStart = (worker: WorkerInterface) => {
        if (hash != null) {
          this._cacheKeys[hash] = worker;
        }
      };

      const onEnd: OnEnd = (error: Error | null, result: unknown) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      };

      const task = {onEnd, onStart, request};
      if (worker) {
        this._enqueue(task, worker.getWorkerId());
      } else {
        this._push(task);
      }
    });
  }

  _getNextJob(workerId: number): QueueChildMessage | null {
    let queueHead = this._queue[workerId];

    while (queueHead && queueHead.request[1]) {
      queueHead = queueHead.next || null;
    }

    this._queue[workerId] = queueHead;

    return queueHead;
  }

  _process(workerId: number): Farm {
    if (this.isLocked(workerId)) {
      return this;
    }

    const job = this._getNextJob(workerId);

    if (!job) {
      return this;
    }

    const onEnd = (error: Error | null, result: unknown) => {
      job.onEnd(error, result);
      this.unlock(workerId);
      this._process(workerId);
    };

    this.lock(workerId);

    this._callback(workerId, job.request, job.onStart, onEnd);

    job.request[1] = true;

    return this;
  }

  _enqueue(task: QueueChildMessage, workerId: number): Farm {
    if (task.request[1]) {
      return this;
    }

    if (this._queue[workerId]) {
      this._last[workerId].next = task;
    } else {
      this._queue[workerId] = task;
    }

    this._last[workerId] = task;
    this._process(workerId);

    return this;
  }

  _push(task: QueueChildMessage): Farm {
    for (let i = 0; i < this._numOfWorkers; i++) {
      const workerIdx = (this._offset + i) % this._numOfWorkers;
      this._enqueue(task, workerIdx);
    }
    this._offset++;

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
