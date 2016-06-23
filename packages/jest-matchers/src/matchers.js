/* eslint-disable max-len */

/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const matchers = {
  toBe(actual, expected) {
    const result = {pass: actual === expected};

    result.message =
      `expected ${actual} to ${result.pass ? '!==' : '==='} ${expected}`;
    return result;
  },

  toThrow(actual, expected) {
    if (typeof actual !== 'function') {
      throw new Error('expected argument to be a function');
    }

    const result = {};
    let error;

    try {
      actual();
    } catch (err) {
      error = err;
    }


    if (!expected) {
      result.pass = !!error;
      result.message = result.pass
        ? `expected the function to not throw, but it threw ${formatError(error)}`
        : `expected the function to throw, but it didn't`;
      return result;
    } else if (
      typeof expected === 'string' || expected.constructor.name === 'RegExp'
    ) {
      result.pass = error && error.message.match(expected);
      result.message = result.pass
        ? `expected the function to not throw an error matching ${expected}, but it did`
        : `expected the function to throw an error matching ${expected}, but it didn't`;

      return result;
    } else if (typeof expected === 'function') {
      result.pass = error && (error.constructor === expected);
      result.message = result.pass
        ? `expected the function to not throw '${expected}' error, but it did`
        : `expected the function to throw '${expected}' error, but it didn't`;

      return result;
    } else {
      throw new Error(`unexpected argument: ${expected}`);
    }
  },
};

function formatError(err) {
  return err.toString();
}

module.exports = matchers;
