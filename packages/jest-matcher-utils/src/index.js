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

const chalk = require('chalk');

export type ValueType =
  | 'array'
  | 'boolean'
  | 'function'
  | 'null'
  | 'number'
  | 'object'
  | 'regexp'
  | 'string'
  | 'symbol'
  | 'undefined';

const EXPECTED_COLOR = chalk.green;
const RECEIVED_COLOR = chalk.red;

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
    if (value.constructor === RegExp) {
      return 'regexp';
    }
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
    if (value instanceof Error) {
      const name = (value.constructor && value.constructor.name) || 'Error';
      return `${name}: ${value.message}`;
    } else if (typeof value === 'object' && value !== null) {
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

const printReceived = (object: any) => RECEIVED_COLOR(stringify(object));
const printExpected = (value: any) => EXPECTED_COLOR(stringify(value));

const ensureNoExpected = (expected: any, matcherName: string) => {
  matcherName || (matcherName = 'This');
  if (typeof expected !== 'undefined') {
    throw new Error(`${matcherName} matcher does not accept any arguments.`);
  }
};

const ensureActualIsNumber = (actual: any, matcherName: string) => {
  matcherName || (matcherName = 'This matcher');
  if (typeof actual !== 'number') {
    throw new Error(
      `${matcherName} actual value should be a number. ` +
      `'${typeof actual}' was passed.`,
    );
  }
};

const ensureExpectedIsNumber = (expected: any, matcherName: string) => {
  matcherName || (matcherName = 'This matcher');
  if (typeof expected !== 'number') {
    throw new Error(
      `${matcherName} expected value should be a number. ` +
      `'${typeof expected}' was passed.`,
    );
  }
};

const ensureNumbers = (actual: any, expected: any, matcherName: string) => {
  ensureActualIsNumber(actual, matcherName);
  ensureExpectedIsNumber(expected, matcherName);
};

const pluralize =
  (word: string, count: number) => `${count} ${word}${count === 1 ? '' : 's'}`;

const matcherHint = (
  matcherName: string,
  received: string = 'received',
  expected: string = 'expected',
) => {
  return chalk.dim('expect(') + RECEIVED_COLOR(received) +
    chalk.dim(')' + matcherName + '(') +
    EXPECTED_COLOR(expected) + chalk.dim(')');
};

module.exports = {
  EXPECTED_COLOR,
  RECEIVED_COLOR,
  ensureActualIsNumber,
  ensureExpectedIsNumber,
  ensureNoExpected,
  ensureNumbers,
  getType,
  matcherHint,
  pluralize,
  printExpected,
  printReceived,
  stringify,
};
