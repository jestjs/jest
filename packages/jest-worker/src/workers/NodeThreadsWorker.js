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
} from '../types';

// $FlowFixMe: Flow doesn't know about experimental features of Node
const {Worker} = require('worker_threads');

export default class ExpirementalWorker implements WorkerInterface {
  _worker: Worker;
  _options: WorkerOptions;
  _onProcessEnd: OnEnd;

  constructor(options: WorkerOptions) {
    this._options = options;
    this.initialize();
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

    this._worker.postMessage([
      CHILD_MESSAGE_INITIALIZE,
      false,
      this._options.workerPath,
    ]);
  }

  onMessage(response: any /* Should be ParentMessage */) {
    switch (response[0]) {
      case PARENT_MESSAGE_OK:
        this._onProcessEnd(null, response[1], this);
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

        this._onProcessEnd(error, null, this);
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
    onProcessStart(this);
    this._onProcessEnd = onProcessEnd;
    this._worker.postMessage(request);
  }

  getWorkerId(): number {
    return this._options.workerId;
  }

  getStdout(): Readable {
    return this._worker.stdout;
  }

  getStderr(): Readable {
    return this._worker.stderr;
  }
}
