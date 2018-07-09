/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import type {Readable} from 'stream';

import type {ChildMessage, QueueChildMessage, WorkerOptions} from '../types';

export default class BaseWorker {
  _busy: boolean;
  _last: ?QueueChildMessage;
  _options: WorkerOptions;
  _queue: ?QueueChildMessage;
  _retries: number;

  initialize() {
    throw Error('Initializer is required for custom Worker implementations');
  }

  send(message: ChildMessage, onStart: Function, onEnd: Function): void {
    throw Error('"send" method is required for custom Worker implementations');
  }

  _exit(exitCode: number) {
    if (exitCode !== 0) {
      this.initialize();
    }
  }
}
