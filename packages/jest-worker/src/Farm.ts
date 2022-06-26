/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import FifoQueue from './FifoQueue';
import {debug} from './debug';
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
    // TODO rename to _numWorkers
    private _numOfWorkers: number,
    // workerPool.send. TODO rename to _sendToWorkerPool
    private _callback: WorkerCallback,
    options: WorkerFarmOptions = {},
  ) {
    debug(`Farm.constructor: _numOfWorkers = ${_numOfWorkers}`);
    //this._numOfWorkers = _numOfWorkers;
    this._computeWorkerKey = options.computeWorkerKey;
    this._workerSchedulingPolicy =
      options.workerSchedulingPolicy ?? 'round-robin';
    this._taskQueue = options.taskQueue ?? new FifoQueue();
  }

  doWork(
    method: string,
    ...args: Array<unknown>
  ): PromiseWithCustomMessage<unknown> {
    debug('');
    debug(`Farm.doWork: method=${method} args=${args}`);
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
          debug(`Farm.doWork: re-use last worker -> add task to queue`);
          this._taskQueue.enqueue(task, worker.getWorkerId());
          // try to process, fail if worker is blocked
          this._process(worker.getWorkerId());
        } else {
          debug(`Farm.doWork: use any worker -> call push`);
          this._push(task);
        }
      }).bind(null, args),
    );

    promise.UNSTABLE_onCustomMessage = addCustomMessageListener;

    return promise;
  }

  private _process(workerId: number): Farm {
    if (this._isLocked(workerId)) {
      debug(`Farm._process: worker ${workerId} is locked`);
      return this;
    }

    const task = this._taskQueue.dequeue(workerId);
    debug(`Farm._process: worker ${workerId}: task = ${task}`);

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
        debug('');
        debug(`Farm._process: worker ${workerId}: onEnd: calling taskOnEnd`);
        taskOnEnd(error, result);
      }
      taskOnEnd = null;

      debug(`Farm._process: worker ${workerId}: onEnd: done. unlock worker ${workerId}`);

      this._unlock(workerId);
      this._process(workerId);
    };

    debug(`Farm._process: worker ${workerId}: lock worker ${workerId}`);

    this._lock(workerId);

    debug(`Farm._process: worker ${workerId}: send task to worker ...`);

    task.request[1] = this._callback(
      workerId,
      task.request,
      task.onStart,
      onEnd,
      task.onCustomMessage,
    );

    if (task.request[1] == false) {
      // task was not sent to worker
      this._unlock(workerId);
    }

    debug(`Farm._process: worker ${workerId}: send task to worker ... ${task.request[1] ? 'ok' : 'fail'}`);

    return this;
  }

  private _push(task: QueueChildMessage): Farm {

    debug(`Farm._push: add task ${task}`);

    this._taskQueue.enqueue(task); // no worker id -> any worker

    const offset = this._getNextWorkerOffset();
    debug(`Farm._push: offset = ${offset}`);

    debug(`Farm._push: find worker for task ${task}`);
    for (let i = 0; i < this._numOfWorkers; i++) {
      const workerId = (offset + i) % this._numOfWorkers;
      debug(`Farm._push: process worker ${workerId}`);
      this._process(workerId);

      debug(`Farm._push: task.request[1] = ${task.request[1]}`);

      if (task.request[1]) { // found worker
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
        // note: this counts to infinity
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
