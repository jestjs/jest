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

import type {
  Expect,
  ExpectationResult,
  ExpectationObject,
  MatchersObject,
  RawMatcherFn,
  ThrowingMatcherFn,
} from './types';

const matchers = require('./matchers');
const spyMatchers = require('./spy-matchers');
const GLOBAL_MATCHERS_OBJECT_SYMBOL = Symbol.for('$$jest-matchers-object');

if (!global[GLOBAL_MATCHERS_OBJECT_SYMBOL]) {
  Object.defineProperty(
    global,
    GLOBAL_MATCHERS_OBJECT_SYMBOL,
    {value: Object.create(null)},
  );
}

const expect: Expect = (actual: any): ExpectationObject => {
  const allMatchers = global[GLOBAL_MATCHERS_OBJECT_SYMBOL];
  const expectation = {not: {}};
  Object.keys(allMatchers).forEach(name => {
    expectation[name] =
      makeThrowingMatcher(allMatchers[name], false, actual);
    expectation.not[name] =
      makeThrowingMatcher(allMatchers[name], true, actual);
  });

  return expectation;
};

const makeThrowingMatcher = (
  matcher: RawMatcherFn,
  isNot: boolean,
  actual: any,
): ThrowingMatcherFn => {
  return function throwingMatcher(expected, options) {
    const result: ExpectationResult = matcher(
      actual,
      expected,
      options,
      {args: arguments},
    );

    if ((result.pass && isNot) || (!result.pass && !isNot)) { // XOR
      let message = result.message;

      // for performance reasons some of the messages are evaluated
      // lazily
      if (typeof message === 'function') {
        message = message();
      }

      const error = new Error(message);
      // Remove this function from the stack trace frame.
      Error.captureStackTrace(error, throwingMatcher);
      throw error;
    }
  };
};

const addMatchers = (matchersObj: MatchersObject): void => {
  Object.assign(global[GLOBAL_MATCHERS_OBJECT_SYMBOL], matchersObj);
};

// add default jest matchers
addMatchers(matchers);
addMatchers(spyMatchers);

module.exports = {
  addMatchers,
  expect,
};
