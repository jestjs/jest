/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
/* eslint-disable max-len */

'use strict';

import type {MatchersObject} from './types';

const {escapeStrForRegex} = require('jest-util');
const {
  getType,
  matcherHint,
  printReceived,
  printExpected,
} = require('jest-matcher-utils');

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
      return {
        pass: false,
        message:
          'Unexpected argument passed. Expected to get\n' +
          `  ${printExpected('"string"')}, ${printExpected('"Error type"')} or ${printExpected('"regexp"')}.\n` +
          `Got: \n` +
          `  ${printReceived(getType(expected))}: ${printReceived(expected)}.`,
      };
    }
  },
};

const toThrowMatchingStringOrRegexp = (
  error: ?Error,
  pattern: RegExp,
  value: RegExp | string | Error,
) => {
  if (error && !(error instanceof Error)) {
    error = new Error(error);
  }

  const pass = !!(error && error.message.match(pattern));

  const message = pass
    ? () => matcherHint('.not.toThrowError', 'function', getType(value)) + '\n\n' +
      `Expeced the function not to throw an error matching:\n` +
      `  ${printExpected(value)}\n` +
      `But it threw:\n` +
      `  ${printReceived(error)}`
    : () => matcherHint('.toThrowError', 'function', getType(value)) + '\n\n' +
      `Expected the function to throw an error matching:\n` +
      `  ${printExpected(value)}\n` +
      getActualErrorMessage(error);

  return {pass, message};
};

const toThrowMatchingError = (
  error: ?Error,
  ErrorClass: typeof Error,
) => {
  const pass = !!(error && error instanceof ErrorClass);

  const message = pass
    ? () => matcherHint('.not.toThrowError', 'function', 'type') + '\n\n' +
      `Expeced the function not to throw an error of type:\n` +
      `  ${printExpected(ErrorClass.name)}\n` +
      `But it threw:\n` +
      `  ${printReceived(error)}`
    : () => matcherHint('.toThrowError', 'function', 'type') + '\n\n' +
      `Expected the function to throw an error of type:\n` +
      `  ${printExpected(ErrorClass.name)}\n` +
      getActualErrorMessage(error);

  return {pass, message};
};

const getActualErrorMessage = error => {
  return error
    ? `Instead, it threw:\n` +
      `  ${printReceived(error)}`
    : `But it didn't throw anything.`;
};

module.exports = matchers;
