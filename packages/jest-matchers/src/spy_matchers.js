/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {MatchersObject} from 'types/Matchers';

const CALL_PRINT_LIMIT = 3;
const LAST_CALL_PRINT_LIMIT = 1;
import {
  ensureExpectedIsNumber,
  ensureNoExpected,
  EXPECTED_COLOR,
  matcherHint,
  pluralize,
  printExpected,
  printReceived,
  printWithType,
  RECEIVED_COLOR,
} from 'jest-matcher-utils';
import {equals} from './jasmine_utils';

const RECEIVED_NAME = {
  'mock function': 'jest.fn()',
  spy: 'spy',
};

const createToBeCalledMatcher = matcherName => (received, expected) => {
  ensureNoExpected(expected, matcherName);
  ensureMock(received, matcherName);

  const receivedIsSpy = isSpy(received);
  const type = receivedIsSpy ? 'spy' : 'mock function';
  const count = receivedIsSpy
    ? received.calls.count()
    : received.mock.calls.length;
  const calls = receivedIsSpy
    ? received.calls.all().map(x => x.args)
    : received.mock.calls;
  const pass = count > 0;
  const message = pass
    ? () =>
        matcherHint('.not' + matcherName, RECEIVED_NAME[type], '') +
        '\n\n' +
        `Expected ${type} not to be called ` +
        formatReceivedCalls(calls, CALL_PRINT_LIMIT, {sameSentence: true})
    : () =>
        matcherHint(matcherName, RECEIVED_NAME[type], '') +
        '\n\n' +
        `Expected ${type} to have been called.`;

  return {message, pass};
};

const createToBeCalledWithMatcher = matcherName => (
  received: any,
  ...expected: any
) => {
  ensureMock(received, matcherName);

  const receivedIsSpy = isSpy(received);
  const type = receivedIsSpy ? 'spy' : 'mock function';
  const calls = receivedIsSpy
    ? received.calls.all().map(x => x.args)
    : received.mock.calls;
  const pass = calls.some(call => equals(call, expected));

  const message = pass
    ? () =>
        matcherHint('.not' + matcherName, RECEIVED_NAME[type]) +
        '\n\n' +
        `Expected ${type} not to have been called with:\n` +
        `  ${printExpected(expected)}`
    : () =>
        matcherHint(matcherName, RECEIVED_NAME[type]) +
        '\n\n' +
        `Expected ${type} to have been called with:\n` +
        `  ${printExpected(expected)}\n` +
        formatReceivedCalls(calls, CALL_PRINT_LIMIT);

  return {message, pass};
};

const createLastCalledWithMatcher = matcherName => (
  received: any,
  ...expected: any
) => {
  ensureMock(received, matcherName);

  const receivedIsSpy = isSpy(received);
  const type = receivedIsSpy ? 'spy' : 'mock function';
  const calls = receivedIsSpy
    ? received.calls.all().map(x => x.args)
    : received.mock.calls;
  const pass = equals(calls[calls.length - 1], expected);

  const message = pass
    ? () =>
        matcherHint('.not' + matcherName, RECEIVED_NAME[type]) +
        '\n\n' +
        `Expected ${type} to not have been last called with:\n` +
        `  ${printExpected(expected)}`
    : () =>
        matcherHint(matcherName, RECEIVED_NAME[type]) +
        '\n\n' +
        `Expected ${type} to have been last called with:\n` +
        `  ${printExpected(expected)}\n` +
        formatReceivedCalls(calls, LAST_CALL_PRINT_LIMIT, {isLast: true});

  return {message, pass};
};

const spyMatchers: MatchersObject = {
  lastCalledWith: createLastCalledWithMatcher('.lastCalledWith'),
  toBeCalled: createToBeCalledMatcher('.toBeCalled'),
  toBeCalledWith: createToBeCalledWithMatcher('.toBeCalledWith'),
  toHaveBeenCalled: createToBeCalledMatcher('.toHaveBeenCalled'),
  toHaveBeenCalledTimes(received: any, expected: number) {
    const matcherName = '.toHaveBeenCalledTimes';
    ensureExpectedIsNumber(expected, matcherName);
    ensureMock(received, matcherName);

    const receivedIsSpy = isSpy(received);
    const type = receivedIsSpy ? 'spy' : 'mock function';
    const count = receivedIsSpy
      ? received.calls.count()
      : received.mock.calls.length;
    const pass = count === expected;
    const message = pass
      ? () =>
          matcherHint(
            '.not' + matcherName,
            RECEIVED_NAME[type],
            String(expected),
          ) +
          `\n\n` +
          `Expected ${type} not to be called ` +
          `${EXPECTED_COLOR(pluralize('time', expected))}, but it was` +
          ` called exactly ${RECEIVED_COLOR(pluralize('time', count))}.`
      : () =>
          matcherHint(matcherName, RECEIVED_NAME[type], String(expected)) +
          '\n\n' +
          `Expected ${type} to have been called ` +
          `${EXPECTED_COLOR(pluralize('time', expected))},` +
          ` but it was called ${RECEIVED_COLOR(pluralize('time', count))}.`;

    return {message, pass};
  },
  toHaveBeenCalledWith: createToBeCalledWithMatcher('.toHaveBeenCalledWith'),
  toHaveBeenLastCalledWith: createLastCalledWithMatcher(
    '.toHaveBeenLastCalledWith',
  ),
};

const isSpy = spy => spy.calls && typeof spy.calls.count === 'function';

const ensureMock = (mockOrSpy, matcherName) => {
  if (
    !mockOrSpy ||
    ((mockOrSpy.calls === undefined || mockOrSpy.calls.all === undefined) &&
      mockOrSpy._isMockFunction !== true)
  ) {
    throw new Error(
      matcherHint('[.not]' + matcherName, 'jest.fn()', '') +
        '\n\n' +
        `${RECEIVED_COLOR('jest.fn()')} value must be a mock function ` +
        `or spy.\n` +
        printWithType('Received', mockOrSpy, printReceived),
    );
  }
};

const formatReceivedCalls = (calls, limit, options) => {
  if (calls.length) {
    const but = options && options.sameSentence ? 'but' : 'But';
    const count = calls.length - limit;
    const printedCalls = calls
      .slice(-limit)
      .reverse()
      .map(printReceived)
      .join(', ');
    return (
      `${but} it was ${options && options.isLast ? 'last ' : ''}called ` +
      `with:\n  ` +
      printedCalls +
      (count > 0
        ? '\nand ' + RECEIVED_COLOR(pluralize('more call', count)) + '.'
        : '')
    );
  } else {
    return `But it was ${RECEIVED_COLOR('not called')}.`;
  }
};

module.exports = spyMatchers;
