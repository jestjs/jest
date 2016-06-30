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

import type {MatchersObject, TestResult} from '../types';

const diff = require('./diff');

const matchers: MatchersObject = {
  toBe(actual: any, expected: number): TestResult {
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
          let diffString = '\n';

          if (!(typeof actual === 'boolean' && typeof expected === 'boolean')) {
            diffString += diff(expected, actual);
          }
          return `expected '${JSON.stringify(actual)}' to equal (using '===')` +
          ` '${JSON.stringify(expected)}'${diffString}`;
        },
      };
    }
  },
};

module.exports = matchers;
