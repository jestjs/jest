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

const {highlight, getType} = require('jest-matcher-utils');

const matchers: MatchersObject = {
  toThrowError(actual: Function, expected: string | Error | RegExp) {
    let error;

    try {
      actual();
    } catch (e) {
      error = e;
    }

    if (typeof expected === 'string') {
      return toThrowMatchingStringOrRegexp(error, expected);
    } else if (typeof expected === 'function') {
      return toThrowMatchingError(error, expected);
    } else if (expected instanceof RegExp) {
      return toThrowMatchingStringOrRegexp(error, expected);
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
  error,
  strOrRegExp: string | RegExp,
) => {
  const pass = !!(error && error.message.match(strOrRegExp));
  let message = pass
    ? 'Expected the function to not throw an error matching ' +
     `${highlight(strOrRegExp)}, but it did.`
    : 'Expected the function to throw an error matching ' +
      `${highlight(strOrRegExp)}, but it didn't.`;

  if (error) {
    message += _printThrownError(error);
  }

  return {pass, message};
};

const toThrowMatchingError = (error, ErrorClass) => {
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
