/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

class CancelError extends Error {
  constructor() {
    super('Promise was canceled');
    this.name = 'CancelError';
  }
}

export default class PCancelable<T> implements PromiseLike<T> {
  private _pending = true;
  private _canceled = false;
  private readonly _promise: Promise<T>;
  private _cancel?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private _reject: (reason?: unknown) => void = () => {};

  constructor(
    executor: (
      onCancel: (cancelHandler: () => void) => void,
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: unknown) => void,
    ) => void,
  ) {
    this._promise = new Promise((resolve, reject) => {
      this._reject = reject;

      return executor(
        fn => {
          this._cancel = fn;
        },
        val => {
          this._pending = false;
          resolve(val);
        },
        err => {
          this._pending = false;
          reject(err);
        },
      );
    });
  }

  // eslint-disable-next-line unicorn/no-thenable
  then<TResult1 = T, TResult2 = never>(
    onFulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onRejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ): Promise<TResult1 | TResult2> {
    return this._promise.then(onFulfilled, onRejected);
  }

  catch<TResult>(
    onRejected?:
      | ((reason: unknown) => TResult | PromiseLike<TResult>)
      | undefined
      | null,
  ): Promise<T | TResult> {
    return this._promise.catch(onRejected);
  }

  cancel(): void {
    if (!this._pending || this._canceled) {
      return;
    }

    if (typeof this._cancel === 'function') {
      try {
        this._cancel();
      } catch (error) {
        this._reject(error);
      }
    }

    this._canceled = true;
    this._reject(new CancelError());
  }
}
