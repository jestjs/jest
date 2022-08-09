/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {EventEmitter, PassThrough} from 'stream';
import {
  WorkerEvents,
  WorkerInterface,
  WorkerOptions,
  WorkerStates,
} from '../types';

export default abstract class WorkerAbstract
  extends EventEmitter
  implements Pick<WorkerInterface, 'waitForWorkerReady' | 'state'>
{
  private __state = WorkerStates.STARTING;

  protected _fakeStream: PassThrough | null = null;

  protected _exitPromise: Promise<void>;
  protected _resolveExitPromise!: () => void;

  protected _workerReadyPromise: Promise<void> | undefined;
  protected _resolveWorkerReady: (() => void) | undefined;

  public get state(): WorkerStates {
    return this.__state;
  }
  protected set state(value: WorkerStates) {
    if (this.__state !== value) {
      const oldState = this.__state;
      this.__state = value;

      this.emit(WorkerEvents.STATE_CHANGE, value, oldState);
    }
  }

  constructor(options: WorkerOptions) {
    super();

    if (typeof options.on === 'object') {
      for (const [event, handlers] of Object.entries(options.on)) {
        if (Array.isArray(handlers)) {
          for (const handler of handlers) {
            super.on(event, handler);
          }
        } else {
          super.on(event, handlers);
        }
      }
    }

    this._exitPromise = new Promise(resolve => {
      this._resolveExitPromise = resolve;
    });
    this._exitPromise.then(() => {
      this.state = WorkerStates.SHUT_DOWN;
    });
  }

  /**
   * Wait for the worker child process to be ready to handle requests.
   *
   * @returns Promise which resolves when ready.
   */
  public waitForWorkerReady(): Promise<void> {
    if (!this._workerReadyPromise) {
      this._workerReadyPromise = new Promise((resolve, reject) => {
        let settled = false;
        let to: NodeJS.Timeout | undefined;

        switch (this.state) {
          case WorkerStates.OUT_OF_MEMORY:
          case WorkerStates.SHUTTING_DOWN:
          case WorkerStates.SHUT_DOWN:
            settled = true;
            reject(
              new Error(
                `Worker state means it will never be ready: ${this.state}`,
              ),
            );
            break;
          case WorkerStates.STARTING:
          case WorkerStates.RESTARTING:
            this._resolveWorkerReady = () => {
              settled = true;
              resolve();

              if (to) {
                clearTimeout(to);
              }
            };
            break;
          case WorkerStates.OK:
            settled = true;
            resolve();
            break;
        }

        if (!settled) {
          to = setTimeout(() => {
            if (!settled) {
              reject(new Error('Timeout starting worker'));
            }
          }, 500);
        }
      });
    }

    return this._workerReadyPromise;
  }

  /**
   * Used to shut down the current working instance once the children have been
   * killed off.
   */
  protected _shutdown(): void {
    // End the permanent stream so the merged stream end too
    if (this._fakeStream) {
      this._fakeStream.end();
      this._fakeStream = null;
    }

    this._resolveExitPromise();
  }

  protected _getFakeStream(): PassThrough {
    if (!this._fakeStream) {
      this._fakeStream = new PassThrough();
    }
    return this._fakeStream;
  }
}
