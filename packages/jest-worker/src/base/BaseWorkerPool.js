/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import mergeStream from 'merge-stream';
import os from 'os';
import path from 'path';

import Worker from '../ChildProcessWorker';
import {CHILD_MESSAGE_END} from '../types';

import type {Readable} from 'stream';
import type {FarmOptions, WorkerOptions, WorkerInterface} from '../types';

/* istanbul ignore next */
const emptyMethod = () => {};

export default class BaseWorkerPool {
  _stderr: Readable;
  _stdout: Readable;
  _options: FarmOptions;
  _workers: Array<WorkerInterface>;

  constructor(workerPath: string, options: FarmOptions) {
    this._options = options;

    const numWorkers = options.numWorkers || os.cpus().length - 1;
    this._workers = new Array(numWorkers);

    if (!path.isAbsolute(workerPath)) {
      workerPath = require.resolve(workerPath);
    }

    const stdout = mergeStream();
    const stderr = mergeStream();

    for (let i = 0; i < numWorkers; i++) {
      const workerOptions: WorkerOptions = {
        forkOptions: options.forkOptions || {},
        maxRetries: options.maxRetries || 3,
        workerId: i + 1,
        workerPath,
      };

      const worker = this.createWorker(workerOptions);
      const workerStdout = worker.getStdout();
      const workerStderr = worker.getStderr();

      if (workerStdout) {
        stdout.add(workerStdout);
      }

      if (workerStderr) {
        stderr.add(workerStderr);
      }

      this._workers[i] = worker;

      // $FlowFixMe
      this.getStderr = this.getStderr.bind(this);
      // $FlowFixMe
      this.getStdout = this.getStdout.bind(this);
      // $FlowFixMe
      this.getWorkers = this.getWorkers.bind(this);
      // $FlowFixMe
      this.end = this.end.bind(this);
    }

    this._stdout = stdout;
    this._stderr = stderr;
  }

  getStderr(): Readable {
    return this._stderr;
  }

  getStdout(): Readable {
    return this._stdout;
  }

  getWorkers(): Array<WorkerInterface> {
    return this._workers;
  }

  createWorker(workerOptions: WorkerOptions): Worker {
    return new Worker(workerOptions);
  }

  end(): void {
    // We do not cache the request object here. If so, it would only be only
    // processed by one of the workers, and we want them all to close.
    for (let i = 0; i < this._workers.length; i++) {
      this._workers[i].send(
        [CHILD_MESSAGE_END, false],
        emptyMethod,
        emptyMethod,
      );
    }
  }
}
