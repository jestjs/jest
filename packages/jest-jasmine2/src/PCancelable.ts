/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
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

class PCancelable extends Promise {
  private _pending: boolean;
  private _canceled: boolean;
  private _cancel?: () => unknown;
  private _reject: (reason?: any) => unknown;
  private _promise: Promise<unknown>;

  static CancelError: CancelError;

  static fn(fn) {
    return function() {
      const args = [].slice.apply(arguments);
      return new PCancelable((onCancel, resolve, reject) => {
        args.unshift(onCancel);
        fn.apply(null, args).then(resolve, reject);
      });
    };
  }

  // @ts-ignore
  constructor(executor: (onCancel, resolve, reject) => any) {
    this._pending = true;
    this._canceled = false;

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

  then(...args: unknown[]) {
    return this._promise.then.apply(this._promise, args);
  }

  catch(...args: unknown[]) {
    return this._promise.catch.apply(this._promise, args);
  }

  cancel() {
    if (!this._pending || this._canceled) {
      return;
    }

    if (typeof this._cancel === 'function') {
      try {
        this._cancel();
      } catch (err) {
        this._reject(err);
      }
    }

    this._canceled = true;
    this._reject(new CancelError());
  }

  get canceled() {
    return this._canceled;
  }
}

export = PCancelable;
