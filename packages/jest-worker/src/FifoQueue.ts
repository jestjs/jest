/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {QueueChildMessage, TaskQueue} from './types';

type WorkerQueueValue = {
  task: QueueChildMessage;

  /**
   * The task that was at the top of the shared queue at the time this
   * worker specific task was enqueued. Required to maintain FIFO ordering
   * across queues. The worker specific task should only be dequeued if the
   * previous shared task is null or has been processed.
   */
  previousSharedTask: QueueChildMessage | null;
};

/**
 * First-in, First-out task queue that manages a dedicated pool
 * for each worker as well as a shared queue. The FIFO ordering is guaranteed
 * across the worker specific and shared queue.
 */
export default class FifoQueue implements TaskQueue {
  private _workerQueues: Array<InternalQueue<WorkerQueueValue> | undefined> =
    [];
  private readonly _sharedQueue = new InternalQueue<QueueChildMessage>();

  enqueue(task: QueueChildMessage, workerId?: number): void {
    if (workerId == null) {
      this._sharedQueue.enqueue(task);
      return;
    }

    let workerQueue = this._workerQueues[workerId];
    if (workerQueue == null) {
      workerQueue = this._workerQueues[workerId] =
        new InternalQueue<WorkerQueueValue>();
    }

    const sharedTop = this._sharedQueue.peekLast();
    const item = {previousSharedTask: sharedTop, task};

    workerQueue.enqueue(item);
  }

  dequeue(workerId: number): QueueChildMessage | null {
    const workerTop = this._workerQueues[workerId]?.peek();
    const sharedTaskIsProcessed =
      workerTop?.previousSharedTask?.request[1] ?? true;

    // Process the top task from the shared queue if
    // - there's no task in the worker specific queue or
    // - if the non-worker-specific task after which this worker specific task
    //   has been queued wasn't processed yet
    if (workerTop != null && sharedTaskIsProcessed) {
      return this._workerQueues[workerId]?.dequeue()?.task ?? null;
    }

    return this._sharedQueue.dequeue();
  }
}

type QueueItem<TValue> = {
  value: TValue;
  next: QueueItem<TValue> | null;
};

/**
 * FIFO queue for a single worker / shared queue.
 */
class InternalQueue<TValue> {
  private _head: QueueItem<TValue> | null = null;
  private _last: QueueItem<TValue> | null = null;

  enqueue(value: TValue): void {
    const item = {next: null, value};

    if (this._last == null) {
      this._head = item;
    } else {
      this._last.next = item;
    }

    this._last = item;
  }

  dequeue(): TValue | null {
    if (this._head == null) {
      return null;
    }

    const item = this._head;
    this._head = item.next;

    if (this._head == null) {
      this._last = null;
    }

    return item.value;
  }

  peek(): TValue | null {
    return this._head?.value ?? null;
  }

  peekLast(): TValue | null {
    return this._last?.value ?? null;
  }
}
