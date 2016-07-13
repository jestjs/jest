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

import type {ThrowingMatcherFn, ExpectationResult} from './types';

const matchers = require('./matchers');

function expect(actual: any) {
  const expectation = {not: {}};
  const allMatchers = Object.assign({}, matchers);
  Object.keys(allMatchers).forEach(name => {
    expectation[name] = makeThrowingMatcher(allMatchers[name], false, actual);
    expectation.not[name] =
      makeThrowingMatcher(allMatchers[name], true, actual);
  });

  return expectation;
}

function makeThrowingMatcher(
  matcher: (actual: any, expected: any) => ExpectationResult,
  isNot: boolean,
  actual: any,
): ThrowingMatcherFn {
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
}

module.exports = {
  expect,
};
