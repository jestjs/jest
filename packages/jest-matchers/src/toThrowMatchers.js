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
  highlight,
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
      throw new Error(
        'Unexpected argument passed. Expected to get ' +
        '"string", "Error type" or "regexp". Got: ' +
        `${highlight(getType(expected))} ${highlight(expected)}.`,
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
  const message = (error ? getErrorMessage(error) : '') + (pass
    ? `the function not to throw an error matching ${printExpected(String(value))}.`
    : `the function to throw an error matching ${printExpected(String(value))}.`
  );
  return {pass, message};
};

const toThrowMatchingError = (
  error: ?Error,
  ErrorClass: typeof Error,
) => {
  const pass = !!(error && error instanceof ErrorClass);
  const message = (error ? getErrorMessage(error) : '') + (pass
    ? `the function not to throw an error of type ${printExpected(ErrorClass.name)}.`
    : `Expected function to throw an error of type ${printExpected(ErrorClass.name)}.`
  );
  return {pass, message};
};

const getErrorMessage = error => {
  return `Received ${highlight(error.constructor.name + ': ' + error.message)} but expected `;
};

module.exports = matchers;
