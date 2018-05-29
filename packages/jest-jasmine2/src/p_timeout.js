/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Try getting the real promise object from the context, if available. Someone
// could have overridden it in a test.
const Promise = global[Symbol.for('jest-native-promise')] || global.Promise;

// A specialized version of `p-timeout` that does not touch globals.
// It does not throw on timeout.
export default function pTimeout(
  promise: Promise<any>,
  ms: number,
  clearTimeout: (timeoutID: number) => void,
  setTimeout: (func: () => void, delay: number) => number,
  onTimeout: () => any,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(onTimeout()), ms);
    promise.then(
      val => {
        clearTimeout(timer);
        resolve(val);
      },
      err => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
