/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import {PARENT_MESSAGE_ERROR, PARENT_MESSAGE_OK} from '../types';

import type {Readable} from 'stream';

import type {ChildMessage, QueueChildMessage, WorkerOptions} from '../types';

export default class BaseWorker {
  _busy: boolean;
  _child: any;
  _last: ?QueueChildMessage;
  _options: WorkerOptions;
  _queue: ?QueueChildMessage;
  _retries: number;

  getStdout(): Readable {
    return this._child.stdout;
  }

  getStderr(): Readable {
    return this._child.stderr;
  }

  initialize() {
    throw Error('Initializer is required for custom Worker implementations');
  }

  send(message: ChildMessage, onStart: Function, onEnd: Function): void {
    throw Error('"send" method is required for custom Worker implementations');
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

      this._child.send(item.request);
    } else {
      this._last = item;
    }
  }

  _receive(response: any /* Should be ParentMessage */) {
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

  _exit(exitCode: number) {
    if (exitCode !== 0) {
      this.initialize();
    }
  }
}
