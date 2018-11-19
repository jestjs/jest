/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import type {QueueChildMessage} from './types';

export default class QueueManager {
  _callback: Function;
  _last: Array<QueueChildMessage>;
  _locks: Array<boolean>;
  _numOfWorkers: number;
  _offset: number;
  _queue: Array<?QueueChildMessage>;

  constructor(numOfWorkers: number, callback: Function) {
    this._callback = callback;
    this._numOfWorkers = numOfWorkers;
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
    //     PARENT_MESSAGE_CLIENT_ERROR,
    //     error.name,
    //     error.message,
    //     error.stack,
    //     {type: 'WorkerError'},
    //   ]);
    // }
  }

  _process(workerId: number): QueueManager {
    if (this.isLocked(workerId)) {
      return this;
    }

    const job = this.getNextJob(workerId);

    if (!job) {
      return this;
    }

    const onEnd = (error: ?Error, result: mixed) => {
      job.onEnd(error, result);
      this.unlock(workerId);
      this._process(workerId);
    };

    this.lock(workerId);

    this._callback(workerId, job.request, job.onStart, onEnd);

    job.request[1] = true;

    return this;
  }

  getNextJob(workerId: number): ?QueueChildMessage {
    let queueHead = this._queue[workerId];

    if (!queueHead) {
      return null;
    }

    while (queueHead && queueHead.request[1]) {
      queueHead = queueHead.next;
    }

    this._queue[workerId] = queueHead;

    return queueHead;
  }

  enqueue(task: QueueChildMessage, workerId: number): QueueManager {
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

  push(task: QueueChildMessage): QueueManager {
    for (let i = 0; i < this._numOfWorkers; i++) {
      const workerIdx = (this._offset + i) % this._numOfWorkers;
      this.enqueue(task, workerIdx);
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
