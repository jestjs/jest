/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import BaseWorker from './base/BaseWorker';

import type {WorkerOptions} from './types';

export default class ExpirementalWorker extends BaseWorker {
  _options: WorkerOptions;

  constructor(options: WorkerOptions) {
    super();
    this._options = options;
    this._queue = null;

    this.initialize();
  }

  initialize() {
    // $FlowFixMe: Flow doesn't know about experimental features of Node
    const {Worker} = require('worker_threads');

    const worker = new Worker('./child', {
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

    worker.on('message', this._receive.bind(this));
    worker.on('exit', this._exit.bind(this));
  }
}
