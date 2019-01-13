/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {MatcherHintOptions, MatchersObject} from 'types/Matchers';

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
  function(received: Function, expected: any) {
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

    if (expected === undefined) {
      return toThrow(matcherName, options, error);
    } else if (typeof expected === 'function') {
      return toThrowExpectedClass(matcherName, options, error, expected);
    } else if (typeof expected === 'string') {
      return toThrowExpectedString(matcherName, options, error, expected);
    } else if (expected !== null && typeof expected.test === 'function') {
      return toThrowExpectedRegExp(matcherName, options, error, expected);
    } else if (expected !== null && typeof expected === 'object') {
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

const toThrowExpectedRegExp = (
  matcherName: string,
  options: MatcherHintOptions,
  error?: Error,
  expected: RegExp,
) => {
  const pass = error !== undefined && expected.test(error.message);

  const message = pass
    ? () =>
        matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        `Expected error pattern: ${printExpected(expected)}\n` +
        // Possible improvement also for toMatch inverse highlight matching substring.
        // $FlowFixMe: Cannot get error.message because property message is missing in undefined
        `Received error message: ${printReceived(error.message)}\n` +
        // $FlowFixMe: Cannot get error.stack because property stack is missing in undefined
        formatErrorStack(error.stack)
    : () =>
        matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        `Expected error pattern: ${printExpected(expected)}\n` +
        (error !== undefined
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
  const pass = error !== undefined && error.message === expected.message;

  const message = pass
    ? () =>
        matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        `Expected error message: ${printReceived(expected.message)}\n` +
        // $FlowFixMe: Cannot get error.message because property message is missing in undefined
        `Received error message: ${printReceived(error.message)}\n` +
        // $FlowFixMe: Cannot get error.stack because property stack is missing in undefined
        formatErrorStack(error.stack)
    : () =>
        matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        `Expected error message: ${printReceived(expected.message)}\n` +
        (error !== undefined
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
  const pass = error !== undefined && error instanceof expected;

  const message = () =>
    matcherHint(matcherName, undefined, undefined, options) +
    '\n\n' +
    `Expected error name: ${printExpected(expected.name)}\n` +
    (error !== undefined
      ? `Received error name: ${printReceived(error.name)}\n\n` +
        `Received error message: ${printReceived(error.message)}\n` +
        formatErrorStack(error.stack)
      : '\n' + DID_NOT_THROW);

  return {message, pass};
};

const toThrowExpectedString = (
  matcherName: string,
  options: MatcherHintOptions,
  error?: Error,
  expected: string,
) => {
  const pass = error !== undefined && error.message.includes(expected);

  const message = pass
    ? () =>
        matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        `Expected error pattern: ${printExpected(expected)}\n` +
        // Possible improvement also for toMatch inverse highlight matching substring.
        // $FlowFixMe: Cannot get error.message because property message is missing in undefined
        `Received error message: ${printReceived(error.message)}\n` +
        // $FlowFixMe: Cannot get error.stack because property stack is missing in undefined
        formatErrorStack(error.stack)
    : () =>
        matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        `Expected error pattern: ${printExpected(expected)}\n` +
        (error !== undefined
          ? `Received error message: ${printReceived(error.message)}\n` +
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

  const message = () =>
    matcherHint(matcherName, undefined, '', options) +
    '\n\n' +
    (error !== undefined
      ? `Received error name:    ${printReceived(error.name)}\n` +
        `Received error message: ${printReceived(error.message)}\n` +
        formatErrorStack(error.stack)
      : DID_NOT_THROW);

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
