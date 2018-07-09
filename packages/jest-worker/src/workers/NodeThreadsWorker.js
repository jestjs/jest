/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import {
  CHILD_MESSAGE_INITIALIZE,
  PARENT_MESSAGE_OK,
  PARENT_MESSAGE_ERROR,
} from '../types';

import type {Readable} from 'stream';
import type {
  ChildMessage,
  OnEnd,
  OnStart,
  WorkerOptions,
  WorkerInterface,
  QueueChildMessage,
} from '../types';

// $FlowFixMe: Flow doesn't know about experimental features of Node
const {Worker, MessageChannel} = require('worker_threads');

export default class ExpirementalWorker implements WorkerInterface {
  _options: WorkerOptions;
  _worker: Worker;
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

      if (!this._worker) {
        throw Error(
          "Can't process the request without having an active worker",
        );
      }

      this._worker.postMessage(item.request);
    } else {
      this._last = item;
    }
  }

  initialize() {
    this._worker = new Worker(__dirname + '/threadChild.js', {
      eval: false,
      stderr: true,
      stdout: true,

      // $FlowFixMe: Flow does not work well with Object.assign.
      workerData: Object.assign(
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
    });

    this._worker.on('message', this.onMessage.bind(this));
    this._worker.on('exit', this.onExit.bind(this));

    const {port1} = new MessageChannel();

    this._worker.postMessage(
      [CHILD_MESSAGE_INITIALIZE, false, this._options.workerPath, port1],
      [port1],
    );
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
    return this._worker.stdout;
  }

  getStderr(): Readable {
    return this._worker.stderr;
  }
}
