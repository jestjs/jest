/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

type Promisify0<B> = (f: (cb: (error: Error, b: B) => void) => void)
  => () => Promise<B>;
type Promisify1<A1, B> = (f: (a1: A1, cb: (error: Error, b: B) => void) => void)
  => (a1: A1) => Promise<B>;
type Promisify2<A1, A2, B> = (f: (a1: A1, a2: A2, cb: (error: Error, b: B) => void) => void)
  => (a1: A1, a2: A2) => Promise<B>;
type Promisify3<A1, A2, A3, B> = (f: (a1: A1, a2: A2, a3: A3, cb: (error: Error, b: B) => void) => void)
  => (a1: A1, a2: A2, a3: A3) => Promise<B>;
type Promisify4<A1, A2, A3, A4, B> = (f: (a1: A1, a2: A2, a3: A3, a4: A4, cb: (error: Error, b: B) => void) => void)
  => (a1: A1, a2: A2, a3: A3, a4: A4) => Promise<B>;
type Promisify5<A1, A2, A3, A4, A5, B> = (f: (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5, cb: (error: Error, b: B) => void) => void)
  => (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => Promise<B>;

type Promisify = Promisify0
  | Promisify1
  | Promisify2
  | Promisify3
  | Promisify4
  | Promisify5;

/**
 * Converts a continuation passing function to a promise returning function
 */
const promisify: Promisify = fn => {
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
