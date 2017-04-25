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
  ExpectationObject,
  ExpectationResult,
  MatcherContext,
  MatcherState,
  MatchersObject,
  RawMatcherFn,
  ThrowingMatcherFn,
  PromiseMatcherFn,
} from 'types/Matchers';

const matchers = require('./matchers');
const spyMatchers = require('./spyMatchers');
const toThrowMatchers = require('./toThrowMatchers');

const utils = require('jest-matcher-utils');
const {
  any,
  anything,
  arrayContaining,
  objectContaining,
  stringContaining,
  stringMatching,
} = require('./asymmetric-matchers');

const GLOBAL_STATE = Symbol.for('$$jest-matchers-object');

class JestAssertionError extends Error {
  matcherResult: any;
}

const isPromise = obj => {
  return (
    !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  );
};

if (!global[GLOBAL_STATE]) {
  Object.defineProperty(global, GLOBAL_STATE, {
    value: {
      matchers: Object.create(null),
      state: {
        assertionCalls: 0,
        assertionsExpected: null,
        suppressedErrors: [],
      },
    },
  });
}

const expect: Expect = (actual: any): ExpectationObject => {
  const allMatchers = global[GLOBAL_STATE].matchers;
  const expectation = {
    not: {},
    rejects: {not: {}},
    resolves: {not: {}},
  };

  Object.keys(allMatchers).forEach(name => {
    expectation[name] = makeThrowingMatcher(allMatchers[name], false, actual);
    expectation.not[name] = makeThrowingMatcher(
      allMatchers[name],
      true,
      actual,
    );

    expectation.resolves[name] = makeResolveMatcher(
      name,
      allMatchers[name],
      false,
      actual,
    );
    expectation.resolves.not[name] = makeResolveMatcher(
      name,
      allMatchers[name],
      true,
      actual,
    );

    expectation.rejects[name] = makeRejectMatcher(
      name,
      allMatchers[name],
      false,
      actual,
    );
    expectation.rejects.not[name] = makeRejectMatcher(
      name,
      allMatchers[name],
      true,
      actual,
    );
  });

  return expectation;
};

const getMessage = message => {
  // for performance reasons some of the messages are evaluated
  // lazily
  if (typeof message === 'function') {
    message = message();
  }

  if (!message) {
    message = utils.RECEIVED_COLOR(
      'No message was specified for this matcher.',
    );
  }
  return message;
};

const makeResolveMatcher = (
  matcherName: string,
  matcher: RawMatcherFn,
  isNot: boolean,
  actual: Promise<any>,
): PromiseMatcherFn => async (...args) => {
  const matcherStatement = `.resolves.${isNot ? 'not.' : ''}${matcherName}`;
  if (!isPromise(actual)) {
    throw new JestAssertionError(
      utils.matcherHint(matcherStatement, 'received', '') +
        '\n\n' +
        `${utils.RECEIVED_COLOR('received')} value must be a Promise.\n` +
        utils.printWithType('Received', actual, utils.printReceived),
    );
  }

  let result;
  try {
    result = await actual;
  } catch (e) {
    throw new JestAssertionError(
      utils.matcherHint(matcherStatement, 'received', '') +
        '\n\n' +
        `Expected ${utils.RECEIVED_COLOR('received')} Promise to resolve, ` +
        'instead it rejected to value\n' +
        `  ${utils.printReceived(e)}`,
    );
  }
  return makeThrowingMatcher(matcher, isNot, result).apply(null, args);
};

const makeRejectMatcher = (
  matcherName: string,
  matcher: RawMatcherFn,
  isNot: boolean,
  actual: Promise<any>,
): PromiseMatcherFn => async (...args) => {
  const matcherStatement = `.rejects.${isNot ? 'not.' : ''}${matcherName}`;
  if (!isPromise(actual)) {
    throw new JestAssertionError(
      utils.matcherHint(matcherStatement, 'received', '') +
        '\n\n' +
        `${utils.RECEIVED_COLOR('received')} value must be a Promise.\n` +
        utils.printWithType('Received', actual, utils.printReceived),
    );
  }

  let result;
  try {
    result = await actual;
  } catch (e) {
    return makeThrowingMatcher(matcher, isNot, e).apply(null, args);
  }

  throw new JestAssertionError(
    utils.matcherHint(matcherStatement, 'received', '') +
      '\n\n' +
      `Expected ${utils.RECEIVED_COLOR('received')} Promise to reject, ` +
      'instead it resolved to value\n' +
      `  ${utils.printReceived(result)}`,
  );
};

const makeThrowingMatcher = (
  matcher: RawMatcherFn,
  isNot: boolean,
  actual: any,
): ThrowingMatcherFn => {
  return function throwingMatcher(...args) {
    let throws = true;
    const matcherContext: MatcherContext = Object.assign(
      // When throws is disabled, the matcher will not throw errors during test
      // execution but instead add them to the global matcher state. If a
      // matcher throws, test execution is normally stopped immediately. The
      // snapshot matcher uses it because we want to log all snapshot
      // failures in a test.
      {dontThrow: () => throws = false},
      global[GLOBAL_STATE].state,
      {
        isNot,
        utils,
      },
    );
    let result: ExpectationResult;

    try {
      result = matcher.apply(matcherContext, [actual].concat(args));
    } catch (error) {
      // Remove this and deeper functions from the stack trace frame.
      Error.captureStackTrace(error, throwingMatcher);
      throw error;
    }

    _validateResult(result);

    global[GLOBAL_STATE].state.assertionCalls++;

    if ((result.pass && isNot) || (!result.pass && !isNot)) {
      // XOR
      const message = getMessage(result.message);
      const error = new JestAssertionError(message);
      // Passing the result of the matcher with the error so that a custom
      // reporter could access the actual and expected objects of the result
      // for example in order to display a custom visual diff
      error.matcherResult = result;
      // Remove this function from the stack trace frame.
      Error.captureStackTrace(error, throwingMatcher);

      if (throws) {
        throw error;
      } else {
        global[GLOBAL_STATE].state.suppressedErrors.push(error);
      }
    }
  };
};

expect.extend = (matchersObj: MatchersObject): void => {
  Object.assign(global[GLOBAL_STATE].matchers, matchersObj);
};

expect.anything = anything;
expect.any = any;
expect.objectContaining = objectContaining;
expect.arrayContaining = arrayContaining;
expect.stringContaining = stringContaining;
expect.stringMatching = stringMatching;

const _validateResult = result => {
  if (
    typeof result !== 'object' ||
    typeof result.pass !== 'boolean' ||
    (result.message &&
      (typeof result.message !== 'string' &&
        typeof result.message !== 'function'))
  ) {
    throw new Error(
      'Unexpected return from a matcher function.\n' +
        'Matcher functions should ' +
        'return an object in the following format:\n' +
        '  {message?: string | function, pass: boolean}\n' +
        `'${utils.stringify(result)}' was returned`,
    );
  }
};

// add default jest matchers
expect.extend(matchers);
expect.extend(spyMatchers);
expect.extend(toThrowMatchers);

expect.assertions = (expected: number) =>
  global[GLOBAL_STATE].state.assertionsExpected = expected;

expect.setState = (state: MatcherState) => {
  Object.assign(global[GLOBAL_STATE].state, state);
};

expect.getState = () => global[GLOBAL_STATE].state;

module.exports = expect;
