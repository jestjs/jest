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

import {
  PARENT_MESSAGE_ERROR,
  CHILD_MESSAGE_INITIALIZE,
  PARENT_MESSAGE_OK,
  WorkerInterface,
} from '../types';

import type {ChildProcess} from 'child_process';
import type {Readable} from 'stream';

import type {
  ChildMessage,
  OnEnd,
  OnStart,
  WorkerOptions,
  QueueChildMessage,
} from '../types';

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
export default class ChildProcessWorker implements WorkerInterface {
  _child: ChildProcess;
  _busy: boolean;
  _last: ?QueueChildMessage;
  _options: WorkerOptions;
  _queue: ?QueueChildMessage;
  _retries: number;

  constructor(options: WorkerOptions) {
    super();
    this._options = options;
    this._queue = null;

    this.initialize();
  }

  _process() {
    if (this._busy) {
      return;
    }

    let item = this._queue;

    // Calls in the queue might have already been processed by another worker,
    // so we have to skip them.
    while (item && item.request[1]) {
      item = item.next;
    }

    this._queue = item;

    if (item) {
      // Flag the call as processed, so that other workers know that they don't
      // have to process it as well.
      item.request[1] = true;

      // Tell the parent that this item is starting to be processed.
      item.onProcessStart(this);

      this._retries = 0;
      this._busy = true;

      // $FlowFixMe: wrong "ChildProcess.send" signature.
      this._child.send(item.request);
    } else {
      this._last = item;
    }
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

    child.on('message', this.onMessage.bind(this));
    child.on('exit', this.onExit.bind(this));

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

      this.onMessage([
        PARENT_MESSAGE_ERROR,
        error.name,
        error.message,
        error.stack,
        {type: 'WorkerError'},
      ]);
    }
  }

  onMessage(response: any /* Should be ParentMessage */) {
    const item = this._queue;

    if (!item) {
      throw new TypeError('Unexpected response with an empty queue');
    }

    const onProcessEnd = item.onProcessEnd;

    this._busy = false;
    this._process();

    switch (response[0]) {
      case PARENT_MESSAGE_OK:
        onProcessEnd(null, response[1]);
        break;

      case PARENT_MESSAGE_ERROR:
        let error = response[4];

        if (error != null && typeof error === 'object') {
          const extra = error;
          const NativeCtor = global[response[1]];
          const Ctor = typeof NativeCtor === 'function' ? NativeCtor : Error;

          error = new Ctor(response[2]);
          // $FlowFixMe: adding custom properties to errors.
          error.type = response[1];
          error.stack = response[3];

          for (const key in extra) {
            // $FlowFixMe: adding custom properties to errors.
            error[key] = extra[key];
          }
        }

        onProcessEnd(error, null);
        break;

      default:
        throw new TypeError('Unexpected response from worker: ' + response[0]);
    }
  }

  onExit(exitCode: number) {
    if (exitCode !== 0) {
      this.initialize();
    }
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

  getStdout(): Readable {
    return this._child.stdout;
  }

  getStderr(): Readable {
    return this._child.stderr;
  }
}
