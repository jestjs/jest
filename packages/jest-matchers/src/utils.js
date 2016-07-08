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

// Stringify values and remove circular references
function stringify(obj: any): string {
  const set = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (set.has(value)) {
        return '[Circular]';
      }
      set.add(value);
    } else if (typeof value === 'function') {
      return value.toString();
    } else if (value === Infinity) {
      return 'Infinity';
    } else if (value === -Infinity) {
      return '-Infinity';
    } else if (typeof value === 'number' && Number.isNaN(value)) {
      return 'NaN';
    }
    return value;
  });
}

module.exports = {
  stringify,
};
