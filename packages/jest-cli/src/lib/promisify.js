/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

type Promiseify0<B> = (f: (cb: (Error, B) => void) => void)
  => () => Promise<B>;
type Promiseify1<A1, B> = (f: (a1: A1, cb: (Error, B) => void) => void)
  => (a1: A1) => Promise<B>;
type Promiseify2<A1, A2, B> = (f: (a1: A1, a2: A2, cb: (Error, B) => void) => void)
  => (a1: A1, a2: A2) => Promise<B>;
type Promiseify3<A1, A2, A3, B> = (f: (a1: A1, a2: A2, a3: A3, cb: (Error, B) => void) => void)
  => (a1: A1, a2: A2, a3: A3) => Promise<B>;
type Promiseify4<A1, A2, A3, A4, B> = (f: (a1: A1, a2: A2, a3: A3, a4: A4, cb: (Error, B) => void) => void)
  => (a1: A1, a2: A2, a3: A3, a4: A4) => Promise<B>;
type Promiseify5<A1, A2, A3, A4, A5, B> = (f: (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, cb: (Error, B) => void) => void)
  => (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => Promise<B>;

type Promiseify = Promiseify0
  | Promiseify1
  | Promiseify2
  | Promiseify3
  | Promiseify4
  | Promiseify5;

/**
 * Converts a continuation passing function to a promise returning function
 */
const promisify: Promiseify = fn => {
  return function(...args) {
    return new Promise((resolve, reject) => {
      const continuation = (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      };

      args.push(continuation);
      fn.apply(this, args);
    });
  };
};

module.exports = promisify;
