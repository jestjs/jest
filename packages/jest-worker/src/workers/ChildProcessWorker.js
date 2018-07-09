/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import childProcess from 'child_process';

import BaseWorker from '../base/BaseWorker';

import {PARENT_MESSAGE_ERROR, CHILD_MESSAGE_INITIALIZE} from '../types';

import type {ChildProcess} from 'child_process';
import type {Readable} from 'stream';

import type {ChildMessage, OnEnd, OnStart, WorkerOptions} from '../types';

/**
 * This class wraps the child process and provides a nice interface to
 * communicate with. It takes care of:
 *
 *  - Re-spawning the process if it dies.
 *  - Queues calls while the worker is busy.
 *  - Re-sends the requests if the worker blew up.
 *
 * The reason for queueing them here (since childProcess.send also has an
 * internal queue) is because the worker could be doing asynchronous work, and
 * this would lead to the child process to read its receiving buffer and start a
 * second call. By queueing calls here, we don't send the next call to the
 * children until we receive the result of the previous one.
 *
 * As soon as a request starts to be processed by a worker, its "processed"
 * field is changed to "true", so that other workers which might encounter the
 * same call skip it.
 */
export default class ChildProcessWorker extends BaseWorker {
  _child: ChildProcess;

  constructor(options: WorkerOptions) {
    super();
    this._options = options;
    this._queue = null;

    this.initialize();
  }

  getStdout(): Readable {
    return this._child.stdout;
  }

  getStderr(): Readable {
    return this._child.stderr;
  }

  send(request: ChildMessage, onProcessStart: OnStart, onProcessEnd: OnEnd) {
    const item = {next: null, onProcessEnd, onProcessStart, request};

    if (this._last) {
      this._last.next = item;
    } else {
      this._queue = item;
    }

    this._last = item;
    this._process();
  }

  initialize() {
    const child = childProcess.fork(
      require.resolve('./child'),
      // $FlowFixMe: Flow does not work well with Object.assign.
      Object.assign(
        {
          cwd: process.cwd(),
          env: Object.assign({}, process.env, {
            JEST_WORKER_ID: this._options.workerId,
          }),
          // Suppress --debug / --inspect flags while preserving others (like --harmony).
          execArgv: process.execArgv.filter(v => !/^--(debug|inspect)/.test(v)),
          silent: true,
        },
        this._options.forkOptions,
      ),
    );

    child.on('message', this._receive.bind(this));
    child.on('exit', this._exit.bind(this));

    // $FlowFixMe: wrong "ChildProcess.send" signature.
    child.send([CHILD_MESSAGE_INITIALIZE, false, this._options.workerPath]);

    this._retries++;
    this._child = child;
    this._busy = false;

    // If we exceeded the amount of retries, we will emulate an error reply
    // coming from the child. This avoids code duplication related with cleaning
    // the queue, and scheduling the next call.
    if (this._retries > this._options.maxRetries) {
      const error = new Error('Call retries were exceeded');

      this._receive([
        PARENT_MESSAGE_ERROR,
        error.name,
        error.message,
        error.stack,
        {type: 'WorkerError'},
      ]);
    }
  }
}
