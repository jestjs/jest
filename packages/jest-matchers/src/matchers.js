/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {MatchersObject, ExpectationResult} from '../types';

const diff = require('jest-diff');

const matchers: MatchersObject = {
  toBe(actual: any, expected: number): ExpectationResult {
    const pass = actual === expected;

    if (pass) {
      return {
        pass,
        message() {
          return `expected ${actual} to not equal (using '!==') ${expected}`;
        },
      };
    } else {
      return {
        pass,
        message() {
          let diffString = '\n\n';
          diffString += diff(expected, actual);
          return `expected '${stringify(actual)}' to equal (using '===')` +
          ` '${stringify(expected)}'${diffString}`;
        },
      };
    }
  },
};

// Remove circular references
function stringify(obj: any): string {
  const set = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (set.has(value)) {
        return '[Circular]';
      }
      set.add(value);
    }
    return value;
  });
}

module.exports = matchers;
