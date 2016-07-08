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

import type {ValueType} from 'types/Values';

// get the type of a value with handling the edge cases like `typeof []`
// and `typeof null`
const getType = (value: any): ValueType => {
  if (typeof value === 'undefined') {
    return 'undefined';
  } else if (value === null) {
    return 'null';
  } else if (Array.isArray(value)) {
    return 'array';
  } else if (typeof value === 'boolean') {
    return 'boolean';
  } else if (typeof value === 'function') {
    return 'function';
  } else if (typeof value === 'number') {
    return 'number';
  } else if (typeof value === 'string') {
    return 'string';
  } else if (typeof value === 'object') {
    return 'object';
  // $FlowFixMe https://github.com/facebook/flow/issues/1015
  } else if (typeof value === 'symbol') {
    return 'symbol';
  }

  throw new Error(`value of unknown type: ${value}`);
};

// Convert to JSON removing circular references and
// converting JS values to strings.
const stringify = (obj: any): string => {
  const set = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (
        value &&
        value.constructor &&
        value.constructor.name === 'RegExp'
      ) {
        return value.toString();
      } else {
        if (set.has(value)) {
          return '[Circular]';
        }
        set.add(value);
      }
    } else if (typeof value === 'function') {
      return value.toString();
    } else if (typeof value === 'undefined') {
      return 'undefined';
    // $FlowFixMe symbols are not supported by flow yet
    } else if (typeof value === 'symbol') {
      return value.toString();
    } else if (value === Infinity) {
      return 'Infinity';
    } else if (value === -Infinity) {
      return '-Infinity';
    } else if (Number.isNaN(value)) {
      return 'NaN';
    }
    return value;
  });
};

module.exports = {
  getType,
  stringify,
};
