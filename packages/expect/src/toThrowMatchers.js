/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {MatchersObject} from 'types/Matchers';

import {formatStackTrace, separateMessageFromStack} from 'jest-message-util';
import {
  EXPECTED_COLOR,
  RECEIVED_COLOR,
  matcherErrorMessage,
  matcherHint,
  printExpected,
  printReceived,
  printWithType,
} from 'jest-matcher-utils';
import {isError} from './utils';

const DID_NOT_THROW = 'Received function did not throw an exception';

export const createMatcher = (matcherName: string, fromPromise?: boolean) =>
  function(received: Function, expected: string | Error | RegExp) {
    const options = {
      isNot: this.isNot,
      promise: this.promise,
    };

    let error;

    if (fromPromise && isError(received)) {
      error = received;
    } else {
      if (typeof received !== 'function') {
        if (!fromPromise) {
          const placeholder = expected === undefined ? '' : 'expected';
          throw new Error(
            matcherErrorMessage(
              matcherHint(matcherName, undefined, placeholder, options),
              `${RECEIVED_COLOR('received')} value must be a function`,
              printWithType('Received', received, printReceived),
            ),
          );
        }
      } else {
        try {
          received();
        } catch (e) {
          error = e;
        }
      }
    }

    if (error && !error.message && !error.name) {
      error = new Error(error);
    }

    const expectedType = typeof expected;
    if (expectedType === 'undefined') {
      return toThrow(matcherName, options, error);
    } else if (expectedType === 'function') {
      return toThrowExpectedClass(matcherName, options, error, expected);
    } else if (expectedType === 'string') {
      return toThrowExpectedString(matcherName, options, error, expected);
    } else if (expected && typeof expected.test === 'function') {
      return toThrowExpectedRegExp(matcherName, options, error, expected);
    } else if (expected && expectedType === 'object') {
      return toThrowExpectedObject(matcherName, options, error, expected);
    } else {
      throw new Error(
        matcherErrorMessage(
          matcherHint(matcherName, undefined, undefined, options),
          `${EXPECTED_COLOR(
            'expected',
          )} value must be a string or regular expression or class or error`,
          printWithType('Expected', expected, printExpected),
        ),
      );
    }
  };

const matchers: MatchersObject = {
  toThrow: createMatcher('toThrow'),
  toThrowError: createMatcher('toThrowError'),
};

const toThrowExpectedString = (
  matcherName: string,
  options: MatcherHintOptions,
  error?: Error,
  expected: string,
) => {
  const isDefined = error !== undefined;
  const pass = isDefined && error.message.includes(expected);

  const message = pass
    ? () =>
        matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        `Expected error pattern: ${printExpected(expected)}\n` +
        // Possible improvement also for toMatch
        // inverse highlight matching substring:
        `Received error message: ${printReceived(error.message)}\n` +
        formatErrorStack(error.stack)
    : () =>
        matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        `Expected error pattern: ${printExpected(expected)}\n` +
        (isDefined
          ? `Received error message: ${printReceived(error.message)}\n` +
            formatErrorStack(error.stack)
          : '\n' + DID_NOT_THROW);

  return {message, pass};
};

const toThrowExpectedRegExp = (
  matcherName: string,
  options: MatcherHintOptions,
  error?: Error,
  expected: RegExp,
) => {
  const isDefined = error !== undefined;
  const pass = isDefined && expected.test(error.message);

  const message = pass
    ? () =>
        matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        `Expected error pattern: ${printExpected(expected)}\n` +
        // Possible improvement also for toMatch
        // inverse highlight matching substring:
        `Received error message: ${printReceived(error.message)}\n` +
        formatErrorStack(error.stack)
    : () =>
        matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        `Expected error pattern: ${printExpected(expected)}\n` +
        (isDefined
          ? `Received error message: ${printReceived(error.message)}\n` +
            formatErrorStack(error.stack)
          : '\n' + DID_NOT_THROW);

  return {message, pass};
};

const toThrowExpectedObject = (
  matcherName: string,
  options: MatcherHintOptions,
  error?: Error,
  expected: Object,
) => {
  const isDefined = error !== undefined;
  const pass = isDefined && error.message === expected.message;

  const message = pass
    ? () =>
        matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        `Expected error message: ${printReceived(expected.message)}\n` +
        `Received error message: ${printReceived(error.message)}\n` +
        formatErrorStack(error.stack)
    : () =>
        matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        `Expected error message: ${printReceived(expected.message)}\n` +
        (isDefined
          ? `Received error message: ${printReceived(error.message)}\n` +
            formatErrorStack(error.stack)
          : '\n' + DID_NOT_THROW);

  return {message, pass};
};

const toThrowExpectedClass = (
  matcherName: string,
  options: MatcherHintOptions,
  error?: Error,
  expected: typeof Error,
) => {
  const isDefined = error !== undefined;
  const pass = isDefined && error instanceof expected;

  const message = () =>
    matcherHint(matcherName, undefined, undefined, options) +
    '\n\n' +
    `Expected error name: ${printExpected(expected.name)}\n` +
    (isDefined
      ? `Received error name: ${printReceived(error.name)}\n\n` +
        `Received error message: ${printReceived(error.message)}\n` +
        formatErrorStack(error.stack)
      : '\n' + DID_NOT_THROW);

  return {message, pass};
};

const toThrow = (
  matcherName: string,
  options: MatcherHintOptions,
  error?: Error,
) => {
  const pass = error !== undefined;

  const message = pass
    ? () =>
        matcherHint(matcherName, undefined, '', options) +
        '\n\n' +
        `Received error name:    ${printReceived(error.name)}\n` +
        `Received error message: ${printReceived(error.message)}\n` +
        formatErrorStack(error.stack)
    : () =>
        matcherHint(matcherName, undefined, '', options) +
        '\n\n' +
        DID_NOT_THROW;

  return {message, pass};
};

const formatErrorStack = stack =>
  formatStackTrace(
    separateMessageFromStack(stack).stack,
    {
      rootDir: process.cwd(),
      testMatch: [],
    },
    {
      noStackTrace: false,
    },
  );

export default matchers;
