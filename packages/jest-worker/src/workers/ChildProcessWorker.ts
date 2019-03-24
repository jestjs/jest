/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import childProcess, {ChildProcess} from 'child_process';
import {PassThrough} from 'stream';
import mergeStream from 'merge-stream';
import supportsColor from 'supports-color';

import {
  CHILD_MESSAGE_INITIALIZE,
  PARENT_MESSAGE_CLIENT_ERROR,
  PARENT_MESSAGE_SETUP_ERROR,
  PARENT_MESSAGE_OK,
  WorkerInterface,
  ChildMessage,
  OnEnd,
  OnStart,
  WorkerOptions,
  ParentMessage,
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
  private _child!: ChildProcess;
  private _options: WorkerOptions;
  private _onProcessEnd!: OnEnd;
  private _fakeStream: PassThrough | null;
  private _request: ChildMessage | null;
  private _retries!: number;
  private _stderr: ReturnType<typeof mergeStream> | null;
  private _stdout: ReturnType<typeof mergeStream> | null;

  constructor(options: WorkerOptions) {
    this._options = options;
    this._fakeStream = null;
    this._request = null;
    this._stderr = null;
    this._stdout = null;

    this.initialize();
  }

  initialize() {
    const forceColor = supportsColor.stdout ? {FORCE_COLOR: '1'} : {};
    const child = childProcess.fork(require.resolve('./processChild'), [], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        JEST_WORKER_ID: String(this._options.workerId + 1), // 0-indexed workerId, 1-indexed JEST_WORKER_ID
        ...forceColor,
      } as NodeJS.ProcessEnv,
      // Suppress --debug / --inspect flags while preserving others (like --harmony).
      execArgv: process.execArgv.filter(v => !/^--(debug|inspect)/.test(v)),
      silent: true,
      ...this._options.forkOptions,
    });

    if (child.stdout) {
      if (!this._stdout) {
        // We need to add a permanent stream to the merged stream to prevent it
        // from ending when the subprocess stream ends
        this._stdout = mergeStream(this._getFakeStream());
      }

      this._stdout.add(child.stdout);
    }

    if (child.stderr) {
      if (!this._stderr) {
        // We need to add a permanent stream to the merged stream to prevent it
        // from ending when the subprocess stream ends
        this._stderr = mergeStream(this._getFakeStream());
      }

      this._stderr.add(child.stderr);
    }

    child.on('message', this.onMessage.bind(this));
    child.on('exit', this.onExit.bind(this));

    child.send([
      CHILD_MESSAGE_INITIALIZE,
      false,
      this._options.workerPath,
      this._options.setupArgs,
    ]);

    this._child = child;

    this._retries++;

    // If we exceeded the amount of retries, we will emulate an error reply
    // coming from the child. This avoids code duplication related with cleaning
    // the queue, and scheduling the next call.
    if (this._retries > this._options.maxRetries) {
      const error = new Error('Call retries were exceeded');

      this.onMessage([
        PARENT_MESSAGE_CLIENT_ERROR,
        error.name,
        error.message,
        error.stack!,
        {type: 'WorkerError'},
      ]);
    }
  }

  private _shutdown() {
    // End the temporary streams so the merged streams end too
    if (this._fakeStream) {
      this._fakeStream.end();
      this._fakeStream = null;
    }
  }

  onMessage(response: ParentMessage) {
    let error;

    switch (response[0]) {
      case PARENT_MESSAGE_OK:
        this._onProcessEnd(null, response[1]);
        break;

      case PARENT_MESSAGE_CLIENT_ERROR:
        error = response[4];

        if (error != null && typeof error === 'object') {
          const extra = error;
          // @ts-ignore: no index
          const NativeCtor = global[response[1]];
          const Ctor = typeof NativeCtor === 'function' ? NativeCtor : Error;

          error = new Ctor(response[2]);
          error.type = response[1];
          error.stack = response[3];

          for (const key in extra) {
            // @ts-ignore: adding custom properties to errors.
            error[key] = extra[key];
          }
        }

        this._onProcessEnd(error, null);
        break;

      case PARENT_MESSAGE_SETUP_ERROR:
        error = new Error('Error when calling setup: ' + response[2]);

        // @ts-ignore: adding custom properties to errors.
        error.type = response[1];
        error.stack = response[3];

        this._onProcessEnd(error, null);
        break;

      default:
        throw new TypeError('Unexpected response from worker: ' + response[0]);
    }
  }

  onExit(exitCode: number) {
    if (exitCode !== 0) {
      this.initialize();

      if (this._request) {
        this._child.send(this._request);
      }
    } else {
      this._shutdown();
    }
  }

  send(request: ChildMessage, onProcessStart: OnStart, onProcessEnd: OnEnd) {
    onProcessStart(this);
    this._onProcessEnd = (...args) => {
      // Clean the request to avoid sending past requests to workers that fail
      // while waiting for a new request (timers, unhandled rejections...)
      this._request = null;
      return onProcessEnd(...args);
    };

    this._request = request;
    this._retries = 0;
    this._child.send(request);
  }

  getWorkerId() {
    return this._options.workerId;
  }

  getStdout(): NodeJS.ReadableStream | null {
    return this._stdout;
  }

  getStderr(): NodeJS.ReadableStream | null {
    return this._stderr;
  }

  private _getFakeStream() {
    if (!this._fakeStream) {
      this._fakeStream = new PassThrough();
    }
    return this._fakeStream;
  }
}
