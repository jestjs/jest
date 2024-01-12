/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {type ChildProcess, type ForkOptions, fork} from 'child_process';
import {totalmem} from 'os';
import mergeStream = require('merge-stream');
import {stdout as stdoutSupportsColor} from 'supports-color';
import {
  CHILD_MESSAGE_INITIALIZE,
  CHILD_MESSAGE_MEM_USAGE,
  type ChildMessage,
  type OnCustomMessage,
  type OnEnd,
  type OnStart,
  PARENT_MESSAGE_CLIENT_ERROR,
  PARENT_MESSAGE_CUSTOM,
  PARENT_MESSAGE_MEM_USAGE,
  PARENT_MESSAGE_OK,
  PARENT_MESSAGE_SETUP_ERROR,
  type ParentMessage,
  type WorkerInterface,
  type WorkerOptions,
  WorkerStates,
} from '../types';
import WorkerAbstract from './WorkerAbstract';

const SIGNAL_BASE_EXIT_CODE = 128;
const SIGKILL_EXIT_CODE = SIGNAL_BASE_EXIT_CODE + 9;
const SIGTERM_EXIT_CODE = SIGNAL_BASE_EXIT_CODE + 15;

// How long to wait after SIGTERM before sending SIGKILL
export const SIGKILL_DELAY = 500;

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
export default class ChildProcessWorker
  extends WorkerAbstract
  implements WorkerInterface
{
  private _child!: ChildProcess;
  private readonly _options: WorkerOptions;

  private _request: ChildMessage | null;
  private _retries!: number;
  private _onProcessEnd!: OnEnd;
  private _onCustomMessage!: OnCustomMessage;

  private _stdout: ReturnType<typeof mergeStream> | null;
  private _stderr: ReturnType<typeof mergeStream> | null;

  private _stderrBuffer: Array<Buffer> = [];

  private _memoryUsagePromise: Promise<number> | undefined;
  private _resolveMemoryUsage: ((arg0: number) => void) | undefined;

  private _childIdleMemoryUsage: number | null;
  private readonly _childIdleMemoryUsageLimit: number | null;
  private _memoryUsageCheck = false;

  private readonly _childWorkerPath: string;

  constructor(options: WorkerOptions) {
    super(options);

    this._options = options;

    this._request = null;

    this._stdout = null;
    this._stderr = null;
    this._childIdleMemoryUsage = null;
    this._childIdleMemoryUsageLimit = options.idleMemoryLimit || null;

    this._childWorkerPath =
      options.childWorkerPath || require.resolve('./processChild');

    this.state = WorkerStates.STARTING;
    this.initialize();
  }

  initialize(): void {
    if (
      this.state === WorkerStates.OUT_OF_MEMORY ||
      this.state === WorkerStates.SHUTTING_DOWN ||
      this.state === WorkerStates.SHUT_DOWN
    ) {
      return;
    }

    if (this._child && this._child.connected) {
      this._child.kill('SIGKILL');
    }

    this.state = WorkerStates.STARTING;

    const forceColor = stdoutSupportsColor ? {FORCE_COLOR: '1'} : {};
    const silent = this._options.silent ?? true;

    if (!silent) {
      // NOTE: Detecting an out of memory crash is independent of idle memory usage monitoring. We want to
      // monitor for a crash occurring so that it can be handled as required and so we can tell the difference
      // between an OOM crash and another kind of crash. We need to do this because if a worker crashes due to
      // an OOM event sometimes it isn't seen by the worker pool and it just sits there waiting for the worker
      // to respond and it never will.
      console.warn('Unable to detect out of memory event if silent === false');
    }

    this._stderrBuffer = [];

    const options: ForkOptions = {
      cwd: process.cwd(),
      env: {
        ...process.env,
        JEST_WORKER_ID: String(this._options.workerId + 1), // 0-indexed workerId, 1-indexed JEST_WORKER_ID
        ...forceColor,
      },
      // Suppress --debug / --inspect flags while preserving others (like --harmony).
      execArgv: process.execArgv.filter(v => !/^--(debug|inspect)/.test(v)),
      // default to advanced serialization in order to match worker threads
      serialization: 'advanced',
      silent,
      ...this._options.forkOptions,
    };

    this._child = fork(this._childWorkerPath, [], options);

    if (this._child.stdout) {
      if (!this._stdout) {
        // We need to add a permanent stream to the merged stream to prevent it
        // from ending when the subprocess stream ends
        this._stdout = mergeStream(this._getFakeStream());
      }

      this._stdout.add(this._child.stdout);
    }

    if (this._child.stderr) {
      if (!this._stderr) {
        // We need to add a permanent stream to the merged stream to prevent it
        // from ending when the subprocess stream ends
        this._stderr = mergeStream(this._getFakeStream());
      }

      this._stderr.add(this._child.stderr);

      this._child.stderr.on('data', this.stderrDataHandler.bind(this));
    }

    this._child.on('message', this._onMessage.bind(this));
    this._child.on('exit', this._onExit.bind(this));
    this._child.on('disconnect', this._onDisconnect.bind(this));

    this._child.send([
      CHILD_MESSAGE_INITIALIZE,
      false,
      this._options.workerPath,
      this._options.setupArgs,
    ]);

    this._retries++;

    // If we exceeded the amount of retries, we will emulate an error reply
    // coming from the child. This avoids code duplication related with cleaning
    // the queue, and scheduling the next call.
    if (this._retries > this._options.maxRetries) {
      const error = new Error(
        `Jest worker encountered ${this._retries} child process exceptions, exceeding retry limit`,
      );

      this._onMessage([
        PARENT_MESSAGE_CLIENT_ERROR,
        error.name,
        error.message,
        error.stack!,
        {type: 'WorkerError'},
      ]);

      // Clear the request so we don't keep executing it.
      this._request = null;
    }

    this.state = WorkerStates.OK;
    if (this._resolveWorkerReady) {
      this._resolveWorkerReady();
    }
  }

  private stderrDataHandler(chunk: any): void {
    if (chunk) {
      this._stderrBuffer.push(Buffer.from(chunk));
    }

    this._detectOutOfMemoryCrash();

    if (this.state === WorkerStates.OUT_OF_MEMORY) {
      this._workerReadyPromise = undefined;
      this._resolveWorkerReady = undefined;

      this.killChild();
      this._shutdown();
    }
  }

  private _detectOutOfMemoryCrash(): void {
    try {
      const bufferStr = Buffer.concat(this._stderrBuffer).toString('utf8');

      if (
        bufferStr.includes('heap out of memory') ||
        bufferStr.includes('allocation failure;') ||
        bufferStr.includes('Last few GCs')
      ) {
        if (
          this.state === WorkerStates.OK ||
          this.state === WorkerStates.STARTING
        ) {
          this.state = WorkerStates.OUT_OF_MEMORY;
        }
      }
    } catch (error) {
      console.error('Error looking for out of memory crash', error);
    }
  }

  private _onDisconnect() {
    this._workerReadyPromise = undefined;
    this._resolveWorkerReady = undefined;

    this._detectOutOfMemoryCrash();

    if (this.state === WorkerStates.OUT_OF_MEMORY) {
      this.killChild();
      this._shutdown();
    }
  }

  private _onMessage(response: ParentMessage) {
    // Ignore messages not intended for us
    if (!Array.isArray(response)) return;

    // TODO: Add appropriate type check
    let error: any;

    switch (response[0]) {
      case PARENT_MESSAGE_OK:
        this._onProcessEnd(null, response[1]);
        break;

      case PARENT_MESSAGE_CLIENT_ERROR:
        error = response[4];

        if (error != null && typeof error === 'object') {
          const extra = error;
          // @ts-expect-error: no index
          const NativeCtor = globalThis[response[1]];
          const Ctor = typeof NativeCtor === 'function' ? NativeCtor : Error;

          error = new Ctor(response[2]);
          error.type = response[1];
          error.stack = response[3];

          for (const key in extra) {
            error[key] = extra[key];
          }
        }

        this._onProcessEnd(error, null);
        break;

      case PARENT_MESSAGE_SETUP_ERROR:
        error = new Error(`Error when calling setup: ${response[2]}`);

        error.type = response[1];
        error.stack = response[3];

        this._onProcessEnd(error, null);
        break;

      case PARENT_MESSAGE_CUSTOM:
        this._onCustomMessage(response[1]);
        break;

      case PARENT_MESSAGE_MEM_USAGE:
        this._childIdleMemoryUsage = response[1];

        if (this._resolveMemoryUsage) {
          this._resolveMemoryUsage(response[1]);

          this._resolveMemoryUsage = undefined;
          this._memoryUsagePromise = undefined;
        }

        this._performRestartIfRequired();
        break;

      default:
        // Ignore messages not intended for us
        break;
    }
  }

  private _performRestartIfRequired(): void {
    if (this._memoryUsageCheck) {
      this._memoryUsageCheck = false;

      let limit = this._childIdleMemoryUsageLimit;

      // TODO: At some point it would make sense to make use of
      // stringToBytes found in jest-config, however as this
      // package does not have any dependencies on an other jest
      // packages that can wait until some other time.
      if (limit && limit > 0 && limit <= 1) {
        limit = Math.floor(totalmem() * limit);
      } else if (limit) {
        limit = Math.floor(limit);
      }

      if (
        limit &&
        this._childIdleMemoryUsage &&
        this._childIdleMemoryUsage > limit
      ) {
        this.state = WorkerStates.RESTARTING;

        this.killChild();
      }
    }
  }

  private _onExit(exitCode: number | null, signal: NodeJS.Signals | null) {
    this._workerReadyPromise = undefined;
    this._resolveWorkerReady = undefined;

    this._detectOutOfMemoryCrash();

    if (exitCode !== 0 && this.state === WorkerStates.OUT_OF_MEMORY) {
      this._onProcessEnd(
        new Error('Jest worker ran out of memory and crashed'),
        null,
      );

      this._shutdown();
    } else if (
      (exitCode !== 0 &&
        exitCode !== null &&
        exitCode !== SIGTERM_EXIT_CODE &&
        exitCode !== SIGKILL_EXIT_CODE &&
        this.state !== WorkerStates.SHUTTING_DOWN) ||
      this.state === WorkerStates.RESTARTING
    ) {
      this.state = WorkerStates.RESTARTING;

      this.initialize();

      if (this._request) {
        this._child.send(this._request);
      }
    } else {
      // At this point, it's not clear why the child process exited. There could
      // be several reasons:
      //
      //  1. The child process exited successfully after finishing its work.
      //     This is the most likely case.
      //  2. The child process crashed in a manner that wasn't caught through
      //     any of the heuristic-based checks above.
      //  3. The child process was killed by another process or daemon unrelated
      //     to Jest. For example, oom-killer on Linux may have picked the child
      //     process to kill because overall system memory is constrained.
      //
      // If there's a pending request to the child process in any of those
      // situations, the request still needs to be handled in some manner before
      // entering the shutdown phase. Otherwise the caller expecting a response
      // from the worker will never receive indication that something unexpected
      // happened and hang forever.
      //
      // In normal operation, the request is handled and cleared before the
      // child process exits. If it's still present, it's not clear what
      // happened and probably best to throw an error. In practice, this usually
      // happens when the child process is killed externally.
      //
      // There's a reasonable argument that the child process should be retried
      // with request re-sent in this scenario. However, if the problem was due
      // to situations such as oom-killer attempting to free up system
      // resources, retrying would exacerbate the problem.
      const isRequestStillPending = !!this._request;
      if (isRequestStillPending) {
        // If a signal is present, we can be reasonably confident the process
        // was killed externally. Log this fact so it's more clear to users that
        // something went wrong externally, rather than a bug in Jest itself.
        const error = new Error(
          signal == null
            ? `A jest worker process (pid=${this._child.pid}) crashed for an unknown reason: exitCode=${exitCode}`
            : `A jest worker process (pid=${this._child.pid}) was terminated by another process: signal=${signal}, exitCode=${exitCode}. Operating system logs may contain more information on why this occurred.`,
        );

        this._onProcessEnd(error, null);
      }

      this._shutdown();
    }
  }

  send(
    request: ChildMessage,
    onProcessStart: OnStart,
    onProcessEnd: OnEnd,
    onCustomMessage: OnCustomMessage,
  ): void {
    this._stderrBuffer = [];

    onProcessStart(this);

    this._onProcessEnd = (...args) => {
      const hasRequest = !!this._request;

      // Clean the request to avoid sending past requests to workers that fail
      // while waiting for a new request (timers, unhandled rejections...)
      this._request = null;

      if (
        this._childIdleMemoryUsageLimit &&
        this._child.connected &&
        hasRequest
      ) {
        this.checkMemoryUsage();
      }

      return onProcessEnd(...args);
    };

    this._onCustomMessage = (...arg) => onCustomMessage(...arg);

    this._request = request;
    this._retries = 0;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this._child.send(request, () => {});
  }

  waitForExit(): Promise<void> {
    return this._exitPromise;
  }

  killChild(): NodeJS.Timeout {
    // We store a reference so that there's no way we can accidentally
    // kill a new worker that has been spawned.
    const childToKill = this._child;

    childToKill.kill('SIGTERM');
    return setTimeout(() => childToKill.kill('SIGKILL'), SIGKILL_DELAY);
  }

  forceExit(): void {
    this.state = WorkerStates.SHUTTING_DOWN;

    const sigkillTimeout = this.killChild();
    this._exitPromise.then(() => clearTimeout(sigkillTimeout));
  }

  getWorkerId(): number {
    return this._options.workerId;
  }

  /**
   * Gets the process id of the worker.
   *
   * @returns Process id.
   */
  getWorkerSystemId(): number {
    return this._child.pid!;
  }

  getStdout(): NodeJS.ReadableStream | null {
    return this._stdout;
  }

  getStderr(): NodeJS.ReadableStream | null {
    return this._stderr;
  }

  /**
   * Gets the last reported memory usage.
   *
   * @returns Memory usage in bytes.
   */
  getMemoryUsage(): Promise<number | null> {
    if (!this._memoryUsagePromise) {
      let rejectCallback!: (err: Error) => void;

      const promise = new Promise<number>((resolve, reject) => {
        this._resolveMemoryUsage = resolve;
        rejectCallback = reject;
      });
      this._memoryUsagePromise = promise;

      if (!this._child.connected && rejectCallback) {
        rejectCallback(new Error('Child process is not running.'));

        this._memoryUsagePromise = undefined;
        this._resolveMemoryUsage = undefined;

        return promise;
      }

      this._child.send([CHILD_MESSAGE_MEM_USAGE], err => {
        if (err && rejectCallback) {
          this._memoryUsagePromise = undefined;
          this._resolveMemoryUsage = undefined;

          rejectCallback(err);
        }
      });

      return promise;
    }

    return this._memoryUsagePromise;
  }

  /**
   * Gets updated memory usage and restarts if required
   */
  checkMemoryUsage(): void {
    if (this._childIdleMemoryUsageLimit) {
      this._memoryUsageCheck = true;
      this._child.send([CHILD_MESSAGE_MEM_USAGE], err => {
        if (err) {
          console.error('Unable to check memory usage', err);
        }
      });
    } else {
      console.warn(
        'Memory usage of workers can only be checked if a limit is set',
      );
    }
  }

  isWorkerRunning(): boolean {
    return this._child.connected && !this._child.killed;
  }
}
