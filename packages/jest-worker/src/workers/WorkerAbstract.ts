/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {WorkerInterface, WorkerStates} from '../types';

export default abstract class WorkerAbstract
  implements Pick<WorkerInterface, 'waitForWorkerReady'>
{
  protected _state = WorkerStates.STARTING;

  protected _workerReadyPromise: Promise<void> | undefined;
  protected _resolveWorkerReady: (() => void) | undefined;

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

        switch (this._state) {
          case WorkerStates.OUT_OF_MEMORY:
          case WorkerStates.SHUTTING_DOWN:
          case WorkerStates.SHUT_DOWN:
            settled = true;
            reject(
              new Error(
                `Worker state means it will never be ready: ${this._state}`,
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
}
