/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  CHILD_MESSAGE_CALL,
  ChildMessage,
  FarmOptions,
  OnEnd,
  OnStart,
  QueueChildMessage,
  WorkerInterface,
} from './types';

import Queue from './Queue';

export default class Farm {
  private _computeWorkerKey: FarmOptions['computeWorkerKey'];
  private _cacheKeys: Record<string, WorkerInterface>;
  private _callback: Function;
  private _locks: Array<boolean>;
  private _numOfWorkers: number;
  private _offset: number;
  private _queue: Array<Queue>;

  constructor(
    numOfWorkers: number,
    callback: Function,
    computeWorkerKey?: FarmOptions['computeWorkerKey'],
  ) {
    this._cacheKeys = Object.create(null);
    this._callback = callback;
    this._locks = [];
    this._numOfWorkers = numOfWorkers;
    this._offset = 0;
    this._queue = [];

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

  private _getNextTask(workerId: number) {
    let queueHead = this._queue[workerId].shift();

    while (queueHead && queueHead.request[1]) {
      queueHead = this._queue[workerId].shift();
    }

    return queueHead;
  }

  private _process(workerId: number): Farm {
    if (this._isLocked(workerId)) {
      return this;
    }

    const task = this._getNextTask(workerId);
    if (!task) {
      return this;
    }

    const onEnd = (error: Error | null, result: unknown) => {
      task.onEnd(error, result);

      this._unlock(workerId);
      this._process(workerId);
    };

    task.request[1] = true;

    this._lock(workerId);
    this._callback(workerId, task.request, task.onStart, onEnd);

    this._queue[workerId].flush();

    return this;
  }

  private _enqueue(task: QueueChildMessage, workerId: number): Farm {
    if (task.request[1]) {
      return this;
    }

    if (!this._queue[workerId]) {
      this._queue[workerId] = new Queue();
    }

    this._queue[workerId].push(task);
    this._process(workerId);

    return this;
  }

  private _push(task: QueueChildMessage): Farm {
    for (let i = 0; i < this._numOfWorkers; i++) {
      this._enqueue(task, (this._offset + i) % this._numOfWorkers);
    }

    this._offset++;

    return this;
  }

  private _lock(workerId: number): void {
    this._locks[workerId] = true;
  }

  private _unlock(workerId: number): void {
    this._locks[workerId] = false;
  }

  private _isLocked(workerId: number): boolean {
    return this._locks[workerId];
  }
}
