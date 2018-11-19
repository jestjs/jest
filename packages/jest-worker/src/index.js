/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import os from 'os';
import {CHILD_MESSAGE_CALL, WorkerInterface} from './types';
import WorkerPool from './WorkerPool';
import QueueManager from './QueueManager';

import type {
  WorkerPoolInterface,
  WorkerPoolOptions,
  FarmOptions,
  ChildMessage,
} from './types';
import type {Readable} from 'stream';

function getExposedMethods(
  workerPath: string,
  options: FarmOptions,
): $ReadOnlyArray<string> {
  let exposedMethods = options.exposedMethods;

  // If no methods list is given, try getting it by auto-requiring the module.
  if (!exposedMethods) {
    // $FlowFixMe: This has to be a dynamic require.
    const module: Function | Object = require(workerPath);

    exposedMethods = Object.keys(module).filter(
      name => typeof module[name] === 'function',
    );

    if (typeof module === 'function') {
      exposedMethods.push('default');
    }
  }

  return exposedMethods;
}

function canUseWorkerThreads(): boolean {
  let workerThreadsAreSupported = false;
  try {
    // $FlowFixMe: Flow doesn't know about experimental APIs
    require('worker_threads');
    workerThreadsAreSupported = true;
  } catch (_) {}

  return workerThreadsAreSupported;
}

/**
 * The Jest farm (publicly called "Worker") is a class that allows you to queue
 * methods across multiple child processes, in order to parallelize work. This
 * is done by providing an absolute path to a module that will be loaded on each
 * of the child processes, and bridged to the main process.
 *
 * Bridged methods are specified by using the "exposedMethods" property of the
 * "options" object. This is an array of strings, where each of them corresponds
 * to the exported name in the loaded module.
 *
 * You can also control the amount of workers by using the "numWorkers" property
 * of the "options" object, and the settings passed to fork the process through
 * the "forkOptions" property. The amount of workers defaults to the amount of
 * CPUS minus one.
 *
 * Queueing calls can be done in two ways:
 *   - Standard method: calls will be redirected to the first available worker,
 *     so they will get executed as soon as they can.
 *
 *   - Sticky method: if a "computeWorkerKey" method is provided within the
 *   config, the resulting string of this method will be used as a key.
 *   Everytime this key is returned, it is guaranteed that your job will be
 *   processed by the same worker. This is specially useful if your workers are
 *   caching results.
 */
export default class JestWorker {
  _cacheKeys: {[string]: WorkerInterface, __proto__: null};
  _ending: boolean;
  _options: FarmOptions;
  _queueManager: QueueManager;
  _threadPool: WorkerPoolInterface;

  constructor(workerPath: string, options?: FarmOptions) {
    this._cacheKeys = Object.create(null);
    this._options = Object.assign({}, options);

    const workerPoolOptions: WorkerPoolOptions = {
      forkOptions: this._options.forkOptions || {},
      maxRetries: this._options.maxRetries || 3,
      setupArgs: this._options.setupArgs || [],
      numWorkers: Math.max(os.cpus().length - 1, 1),
      useWorkers: canUseWorkerThreads(),
    };

    this._threadPool = this._options.WorkerPool
      ? new this._options.WorkerPool(workerPath, workerPoolOptions)
      : new WorkerPool(workerPath, workerPoolOptions);

    this._queueManager = new QueueManager(
      workerPoolOptions.numWorkers,
      this._threadPool.send.bind(this._threadPool),
    );

    this._bindExposedWorkerMethods(workerPath, this._options);
  }

  _bindExposedWorkerMethods(workerPath: string, options: FarmOptions): void {
    getExposedMethods(workerPath, options).forEach(name => {
      if (name.startsWith('_')) {
        return;
      }

      if (this.constructor.prototype.hasOwnProperty(name)) {
        throw new TypeError('Cannot define a method called ' + name);
      }

      // $FlowFixMe: dynamic extension of the class instance is expected.
      this[name] = this._callFunctionWithArgs.bind(this, name);
    });
  }

  // eslint-disable-next-line no-unclear-flowtypes
  _callFunctionWithArgs(method: string, ...args: Array<any>): Promise<any> {
    if (this._ending) {
      throw new Error('Farm is ended, no more calls can be done to it');
    }

    return new Promise((resolve, reject) => {
      const {computeWorkerKey} = this._options;
      const request: ChildMessage = [CHILD_MESSAGE_CALL, false, method, args];

      let worker: ?WorkerInterface = null;
      let hash: ?string = null;

      if (computeWorkerKey) {
        hash = computeWorkerKey.apply(this, [method].concat(args));
        worker = hash == null ? null : this._cacheKeys[hash];
      }

      const onStart: onStart = (worker: WorkerInterface) => {
        if (hash != null) {
          this._cacheKeys[hash] = worker;
        }
      };

      const onEnd: onEnd = (error: Error, result: mixed) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      };

      const task = {onEnd, onStart, request};
      if (worker) {
        this._queueManager.enqueue(task, worker.getWorkerId());
      } else {
        this._queueManager.push(task);
      }
    });
  }

  getStderr(): Readable {
    return this._threadPool.getStderr();
  }

  getStdout(): Readable {
    return this._threadPool.getStdout();
  }

  end(): void {
    if (this._ending) {
      throw new Error('Farm is ended, no more calls can be done to it');
    }

    this._threadPool.end();

    this._ending = true;
  }
}
