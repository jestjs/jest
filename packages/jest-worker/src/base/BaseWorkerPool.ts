/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import mergeStream = require('merge-stream');
import {debug} from '../debug';

//import type {MergedStream} from '@types/merge-stream'; // requires esModuleInterop
interface MergedStream extends NodeJS.ReadWriteStream {
    add(source: NodeJS.ReadableStream | ReadonlyArray<NodeJS.ReadableStream>): MergedStream;
    isEmpty(): boolean;
}
import {
  CHILD_MESSAGE_END,
  PoolExitResult,
  WorkerInterface,
  WorkerOptions,
  WorkerPoolOptions,
} from '../types';

// How long to wait for the child process to terminate
// after CHILD_MESSAGE_END before sending force exiting.
const FORCE_EXIT_DELAY = 500;

/* istanbul ignore next */
// eslint-disable-next-line @typescript-eslint/no-empty-function
const emptyMethod = () => {};

export default class BaseWorkerPool {
  private readonly _stderr: MergedStream;
  private readonly _stdout: MergedStream;
  protected readonly _options: WorkerPoolOptions;
  protected readonly _workerPath: string;
  private readonly _workers: Array<WorkerInterface>;
  private readonly _workerTokens: Array<number | undefined>;

  constructor(workerPath: string, options: WorkerPoolOptions) {
    this._workerPath = workerPath;
    this._options = options;

    this._stdout = mergeStream();
    this._stderr = mergeStream();

    if (options.jobClient) {
      // with jobClient, override numWorkers
      // NOTE maxJobs is upper bound. minJobs is 1
      options.numWorkers = options.jobClient.maxJobs;
    }

    this._workers = new Array(options.numWorkers);
    this._workerTokens = new Array(options.numWorkers);

    if (options.jobClient) {
      // start 1 worker, grow on demand
      this._addWorker(0, true);
    }
    else {
      debug(`BaseWorkerPool.constructor: no jobClient -> start all workers before demand`)
      // no jobclient -> numWorkers is static
      // start all workers before demand
      for (let i = 0; i < options.numWorkers; i++) {
        this._addWorker(i);
      }
    }
  }

  _addWorker(workerId: number, ignoreJobClient = false): WorkerInterface | null {
    debug(`BaseWorkerPool._addWorker`)
    // ignoreJobClient is true for the first worker with jobclient

    if (this._workers[workerId]) return this._workers[workerId];

    if (this._options.jobClient && !ignoreJobClient) {
      const numWorkers = this._workers.filter(Boolean).length;
      if (numWorkers > 0) {
        const token = this._options.jobClient.acquire();
        if (token == null) {
          return null; // jobserver is full, try again later
        }
        this._workerTokens[workerId] = token;
      }
      // else: dont acquire token for the first worker
    }

    const {forkOptions, maxRetries, resourceLimits, setupArgs} = this._options;
    const workerOptions: WorkerOptions = {
      forkOptions,
      maxRetries,
      resourceLimits,
      setupArgs,
      workerId,
      workerPath: this._workerPath,
    };

    const worker = this.createWorker(workerOptions);
    const workerStdout = worker.getStdout();
    const workerStderr = worker.getStderr();

    if (workerStdout) {
      this._stdout.add(workerStdout);
    }

    if (workerStderr) {
      this._stderr.add(workerStderr);
    }

    this._workers[workerId] = worker;
    return worker;
  }

  getStderr(): NodeJS.ReadableStream {
    return this._stderr;
  }

  getStdout(): NodeJS.ReadableStream {
    return this._stdout;
  }

  getWorkers(): Array<WorkerInterface> {
    return this._workers;
  }

  getWorkerById(workerId: number): WorkerInterface | null {
    if (this._options.jobClient && this._workers[workerId] == undefined) {
      // try to create new worker
      debug(`BaseWorkerPool.getWorkerById: create worker ${workerId}`);
      return this._addWorker(workerId);
    }
    return this._workers[workerId];
  }

  createWorker(_workerOptions: WorkerOptions): WorkerInterface {
    throw Error('Missing method createWorker in WorkerPool');
  }

  async end(): Promise<PoolExitResult> {
    // We do not cache the request object here. If so, it would only be only
    // processed by one of the workers, and we want them all to close.
    const workerExitPromises = this._workers.map(async (worker, workerId) => {
      if (!worker) return false;
      worker.send(
        [CHILD_MESSAGE_END, false],
        emptyMethod,
        emptyMethod,
        emptyMethod,
      );

      // Schedule a force exit in case worker fails to exit gracefully so
      // await worker.waitForExit() never takes longer than FORCE_EXIT_DELAY
      let forceExited = false;
      const forceExitTimeout = setTimeout(() => {
        worker.forceExit();
        forceExited = true;
      }, FORCE_EXIT_DELAY);

      await worker.waitForExit();
      // Worker ideally exited gracefully, don't send force exit then
      clearTimeout(forceExitTimeout);

      if (this._options.jobClient) {
        const token = this._workerTokens[workerId];
        if (token != undefined) {
          this._options.jobClient.release(token);
          this._workerTokens[workerId] = undefined;
        }
      }

      return forceExited;
    });

    const workerExits = await Promise.all(workerExitPromises);
    return workerExits.reduce<PoolExitResult>(
      (result, forceExited) => ({
        forceExited: result.forceExited || forceExited,
      }),
      {forceExited: false},
    );
  }
}
