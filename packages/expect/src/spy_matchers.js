/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
import {iterableEquality, partition} from './utils';

const createToBeCalledMatcher = matcherName => (received, expected) => {
  ensureNoExpected(expected, matcherName);
  ensureMock(received, matcherName);

  const receivedIsSpy = isSpy(received);
  const type = receivedIsSpy ? 'spy' : 'mock function';
  const receivedName = receivedIsSpy ? 'spy' : received.getMockName();
  const count = receivedIsSpy
    ? received.calls.count()
    : received.mock.calls.length;
  const calls = receivedIsSpy
    ? received.calls.all().map(x => x.args)
    : received.mock.calls;
  const pass = count > 0;
  const message = pass
    ? () =>
        matcherHint('.not' + matcherName, receivedName, '') +
        '\n\n' +
        `Expected ${type} not to be called ` +
        formatReceivedCalls(calls, CALL_PRINT_LIMIT, {sameSentence: true})
    : () =>
        matcherHint(matcherName, receivedName, '') +
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
  const receivedName = receivedIsSpy ? 'spy' : received.getMockName();
  const calls = receivedIsSpy
    ? received.calls.all().map(x => x.args)
    : received.mock.calls;

  const [match, fail] = partition(calls, call =>
    equals(call, expected, [iterableEquality]),
  );
  const pass = match.length > 0;

  const message = pass
    ? () =>
        matcherHint('.not' + matcherName, receivedName) +
        '\n\n' +
        `Expected ${type} not to have been called with:\n` +
        `  ${printExpected(expected)}`
    : () =>
        matcherHint(matcherName, receivedName) +
        '\n\n' +
        `Expected ${type} to have been called with:\n` +
        formatMismatchedCalls(fail, expected, CALL_PRINT_LIMIT);

  return {message, pass};
};

const createLastCalledWithMatcher = matcherName => (
  received: any,
  ...expected: any
) => {
  ensureMock(received, matcherName);

  const receivedIsSpy = isSpy(received);
  const type = receivedIsSpy ? 'spy' : 'mock function';
  const receivedName = receivedIsSpy ? 'spy' : received.getMockName();
  const calls = receivedIsSpy
    ? received.calls.all().map(x => x.args)
    : received.mock.calls;
  const pass = equals(calls[calls.length - 1], expected, [iterableEquality]);

  const message = pass
    ? () =>
        matcherHint('.not' + matcherName, receivedName) +
        '\n\n' +
        `Expected ${type} to not have been last called with:\n` +
        `  ${printExpected(expected)}`
    : () =>
        matcherHint(matcherName, receivedName) +
        '\n\n' +
        `Expected ${type} to have been last called with:\n` +
        formatMismatchedCalls(calls, expected, LAST_CALL_PRINT_LIMIT);

  return {message, pass};
};

const spyMatchers: MatchersObject = {
  lastCalledWith: createLastCalledWithMatcher('.lastCalledWith'),
  nthCalledWith(received: any, nth: number, ...expected: any) {
    const matcherName = '.nthCalledWith';
    ensureMock(received, matcherName);

    const receivedIsSpy = isSpy(received);
    const type = receivedIsSpy ? 'spy' : 'mock function';

    if (typeof nth !== 'number' || parseInt(nth, 10) !== nth || nth < 1) {
      const message = () =>
        `nth value ${printReceived(
          nth,
        )} must be a positive integer greater than ${printExpected(0)}`;
      const pass = false;
      return {message, pass};
    }

    const receivedName = receivedIsSpy ? 'spy' : received.getMockName();
    const calls = receivedIsSpy
      ? received.calls.all().map(x => x.args)
      : received.mock.calls;
    const pass = equals(calls[nth - 1], expected, [iterableEquality]);

    const message = pass
      ? () =>
          matcherHint('.not' + matcherName, receivedName) +
          '\n\n' +
          `Expected ${type} ${nthToString(
            nth,
          )} call to not have been called with:\n` +
          `  ${printExpected(expected)}`
      : () =>
          matcherHint(matcherName, receivedName) +
          '\n\n' +
          `Expected ${type} ${nthToString(
            nth,
          )} call to have been called with:\n` +
          formatMismatchedCalls(calls, expected, LAST_CALL_PRINT_LIMIT);

    return {message, pass};
  },
  toBeCalled: createToBeCalledMatcher('.toBeCalled'),
  toBeCalledWith: createToBeCalledWithMatcher('.toBeCalledWith'),
  toHaveBeenCalled: createToBeCalledMatcher('.toHaveBeenCalled'),
  toHaveBeenCalledTimes(received: any, expected: number) {
    const matcherName = '.toHaveBeenCalledTimes';
    ensureExpectedIsNumber(expected, matcherName);
    ensureMock(received, matcherName);

    const receivedIsSpy = isSpy(received);
    const type = receivedIsSpy ? 'spy' : 'mock function';
    const receivedName = receivedIsSpy ? 'spy' : received.getMockName();
    const count = receivedIsSpy
      ? received.calls.count()
      : received.mock.calls.length;
    const pass = count === expected;
    const message = pass
      ? () =>
          matcherHint('.not' + matcherName, receivedName, String(expected)) +
          `\n\n` +
          `Expected ${type} not to be called ` +
          `${EXPECTED_COLOR(pluralize('time', expected))}, but it was` +
          ` called exactly ${RECEIVED_COLOR(pluralize('time', count))}.`
      : () =>
          matcherHint(matcherName, receivedName, String(expected)) +
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

const getPrintedCalls = (
  calls: any[],
  limit: number,
  sep: string,
  fn: Function,
): string => {
  const result = [];
  let i = calls.length;

  while (--i >= 0 && --limit >= 0) {
    result.push(fn(calls[i]));
  }

  return result.join(sep);
};

const formatReceivedCalls = (calls, limit, options) => {
  if (calls.length) {
    const but = options && options.sameSentence ? 'but' : 'But';
    const count = calls.length - limit;
    const printedCalls = getPrintedCalls(calls, limit, ', ', printReceived);
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

const formatMismatchedCalls = (calls, expected, limit) => {
  if (calls.length) {
    return getPrintedCalls(
      calls,
      limit,
      '\n\n',
      formatMismatchedArgs.bind(null, expected),
    );
  } else {
    return (
      `  ${printExpected(expected)}\n` +
      `But it was ${RECEIVED_COLOR('not called')}.`
    );
  }
};

const formatMismatchedArgs = (expected, received) => {
  const length = Math.max(expected.length, received.length);

  const printedArgs = [];
  for (let i = 0; i < length; i++) {
    if (!equals(expected[i], received[i], [iterableEquality])) {
      printedArgs.push(
        `  ${printExpected(expected[i])} as argument ${i + 1}, ` +
          `but it was called with ${printReceived(received[i])}.`,
      );
    } else if (i >= expected.length) {
      printedArgs.push(
        `  Did not expect argument ${i + 1} ` +
          `but it was called with ${printReceived(received[i])}.`,
      );
    }
  }

  return printedArgs.join('\n');
};

const nthToString = (nth: number) => {
  switch (nth) {
    case 1:
      return 'first';
    case 2:
      return 'second';
    case 3:
      return 'third';
  }
  return `${nth}th`;
};

export default spyMatchers;
