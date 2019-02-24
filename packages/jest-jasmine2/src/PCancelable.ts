/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-this-before-super, constructor-super */

class CancelError extends Error {
  constructor() {
    super('Promise was canceled');
    this.name = 'CancelError';
  }
}

// @ts-ignore
class PCancelable<T> extends Promise {
  private _pending: boolean;
  private _canceled: boolean;
  private _cancel?: Function;
  private _reject: (reason?: any) => void;
  private _promise: Promise<T>;

  static CancelError: CancelError;

  static fn<F extends (...args: any[]) => any>(fn: F) {
    return function(...args: Parameters<F>) {
      return new PCancelable<ReturnType<F>>((onCancel, resolve, reject) => {
        args.unshift(onCancel);
        fn.apply(null, args).then(resolve, reject);
      });
    };
  }

  // @ts-ignore
  constructor(executor: (onCancel, resolve, reject) => any) {
    this._pending = true;
    this._canceled = false;

    this._promise = new Promise<T>((resolve, reject) => {
      this._reject = reject;

      return executor(
        (fn: Function) => {
          this._cancel = fn;
        },
        (val: unknown) => {
          this._pending = false;
          resolve(val);
        },
        (err?: any) => {
          this._pending = false;
          reject(err);
        },
      );
    });
  }

  then(...args: Parameters<Promise<T>['then']>) {
    return this._promise.then.apply(this._promise, args);
  }

  catch(...args: Parameters<Promise<T>['catch']>) {
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
