/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import FifoQueue from './FifoQueue';
import {
  CHILD_MESSAGE_CALL,
  ChildMessage,
  OnCustomMessage,
  OnEnd,
  OnStart,
  PromiseWithCustomMessage,
  QueueChildMessage,
  TaskQueue,
  WorkerCallback,
  WorkerFarmOptions,
  WorkerInterface,
  WorkerSchedulingPolicy,
} from './types';

export default class Farm {
  private readonly _computeWorkerKey: WorkerFarmOptions['computeWorkerKey'];
  private readonly _workerSchedulingPolicy: WorkerSchedulingPolicy;
  private readonly _cacheKeys: Record<string, WorkerInterface> =
    Object.create(null);
  private readonly _locks: Array<boolean> = [];
  private _offset = 0;
  private readonly _taskQueue: TaskQueue;

  constructor(
    private readonly _numOfWorkers: number,
    private readonly _callback: WorkerCallback,
    options: WorkerFarmOptions = {},
  ) {
    this._computeWorkerKey = options.computeWorkerKey;
    this._workerSchedulingPolicy =
      options.workerSchedulingPolicy ?? 'round-robin';
    this._taskQueue = options.taskQueue ?? new FifoQueue();
  }

  doWork(
    method: string,
    ...args: Array<unknown>
  ): PromiseWithCustomMessage<unknown> {
    const customMessageListeners = new Set<OnCustomMessage>();

    const addCustomMessageListener = (listener: OnCustomMessage) => {
      customMessageListeners.add(listener);
      return () => {
        customMessageListeners.delete(listener);
      };
    };

    const onCustomMessage: OnCustomMessage = message => {
      customMessageListeners.forEach(listener => listener(message));
    };

    const promise: PromiseWithCustomMessage<unknown> = new Promise(
      // Bind args to this function so it won't reference to the parent scope.
      // This prevents a memory leak in v8, because otherwise the function will
      // retain args for the closure.
      ((
        args: Array<unknown>,
        resolve: (value: unknown) => void,
        reject: (reason?: any) => void,
      ) => {
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
          customMessageListeners.clear();
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        };

        const task = {onCustomMessage, onEnd, onStart, request};

        if (worker) {
          this._taskQueue.enqueue(task, worker.getWorkerId());
          this._process(worker.getWorkerId());
        } else {
          this._push(task);
        }
      }).bind(null, args),
    );

    promise.UNSTABLE_onCustomMessage = addCustomMessageListener;

    return promise;
  }

  private _process(workerId: number): Farm {
    if (this._isLocked(workerId)) {
      return this;
    }

    const task = this._taskQueue.dequeue(workerId);

    if (!task) {
      return this;
    }

    if (task.request[1]) {
      throw new Error('Queue implementation returned processed task');
    }

    // Reference the task object outside so it won't be retained by onEnd,
    // and other properties of the task object, such as task.request can be
    // garbage collected.
    let taskOnEnd: OnEnd | null = task.onEnd;
    const onEnd: OnEnd = (error, result) => {
      if (taskOnEnd) {
        taskOnEnd(error, result);
      }
      taskOnEnd = null;

      this._unlock(workerId);
      this._process(workerId);
    };

    task.request[1] = true;

    this._lock(workerId);
    this._callback(
      workerId,
      task.request,
      task.onStart,
      onEnd,
      task.onCustomMessage,
    );

    return this;
  }

  private _push(task: QueueChildMessage): Farm {
    this._taskQueue.enqueue(task);

    const offset = this._getNextWorkerOffset();
    for (let i = 0; i < this._numOfWorkers; i++) {
      this._process((offset + i) % this._numOfWorkers);

      if (task.request[1]) {
        break;
      }
    }

    return this;
  }

  private _getNextWorkerOffset(): number {
    switch (this._workerSchedulingPolicy) {
      case 'in-order':
        return 0;
      case 'round-robin':
        return this._offset++;
    }
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
