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

import type {MatchersObject} from './types';

const {escapeStrForRegex} = require('jest-util');
const {highlight, getType} = require('jest-matcher-utils');

const matchers: MatchersObject = {
  toThrowError(actual: Function, expected: string | Error | RegExp) {
    const value = expected;
    let error;

    try {
      actual();
    } catch (e) {
      error = e;
    }

    if (typeof expected === 'string') {
      expected = new RegExp(escapeStrForRegex(expected));
    }

    if (typeof expected === 'function') {
      return toThrowMatchingError(error, expected);
    } else if (expected instanceof RegExp) {
      return toThrowMatchingStringOrRegexp(error, expected, value);
    } else {
      throw new Error(
        'Unexpected argument passed. Expected to get ' +
        '"string", "Error type" or "regexp". Got: ' +
        `${highlight(getType(expected))} ${highlight(expected)}'`,
      );
    }
  },
};

const toThrowMatchingStringOrRegexp = (
  error: ?Error,
  pattern: RegExp,
  value: RegExp | string | Error,
) => {
  const pass = !!(error && error.message.match(pattern));
  let message = pass
    ? 'Expected the function to not throw an error matching ' +
     `${highlight(String(value))}, but it did.`
    : 'Expected the function to throw an error matching ' +
      `${highlight(String(value))}, but it didn't.`;

  if (error) {
    message += _printThrownError(error);
  }

  return {pass, message};
};

const toThrowMatchingError = (
  error: ?Error,
  ErrorClass: typeof Error,
) => {
  const pass = !!(error && error instanceof ErrorClass);
  let message = pass
    ? 'Expected the function to not throw an error of ' +
      `${highlight(ErrorClass.name)} type, but it did.`
    : 'Expected the function to throw an error of ' +
    `${highlight(ErrorClass.name)} type, but it didn't.`;

  if (error) {
    message += _printThrownError(error);
  }

  return {pass, message};
};

const _printThrownError = error => {
  return '\n' +
    'Actual error:\n' +
    `  Type: ${highlight(error.constructor.name)}\n` +
    `  Message: ${highlight(error.message)}`;
};

module.exports = matchers;
