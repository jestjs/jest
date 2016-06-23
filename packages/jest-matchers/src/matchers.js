/* eslint-disable max-len */

/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const diff = require('./diff');

const matchers = {
  toBe(actual, expected) {
    const result = {pass: actual === expected};

    if (result.pass) {
      result.message = () => `expected ${actual} to not equal (using '!==') ${expected}`;
    } else {
      result.message = () => {
        let diffString = '\n';

        if (!(typeof actual === 'boolean' && typeof expected === 'boolean')) {
          diffString += diff(expected, actual);
        }
        return `expected '${JSON.stringify(actual)}' to equal (using '===')` +
        ` '${JSON.stringify(expected)}'${diffString}`;
      };

    }
    return result;
  },
};

module.exports = matchers;
