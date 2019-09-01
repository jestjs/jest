/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  diff,
  ensureExpectedIsNonNegativeInteger,
  ensureNoExpected,
  EXPECTED_COLOR,
  matcherErrorMessage,
  matcherHint,
  MatcherHintOptions,
  printExpected,
  printReceived,
  printWithType,
  RECEIVED_COLOR,
} from 'jest-matcher-utils';
import {MatchersObject, MatcherState, SyncExpectationResult} from './types';
import {equals} from './jasmineUtils';
import {iterableEquality, partition, isOneline} from './utils';

const PRINT_LIMIT = 3;
const CALL_PRINT_LIMIT = 3;
const RETURN_PRINT_LIMIT = 5;
const LAST_CALL_PRINT_LIMIT = 1;

const printReceivedArgs = (args: Array<unknown>): string =>
  args.length === 0
    ? 'called with no arguments'
    : args.map(arg => printReceived(arg)).join(', ');

const createToBeCalledMatcher = (matcherName: string) =>
  function(
    this: MatcherState,
    received: any,
    expected: unknown,
  ): SyncExpectationResult {
    const expectedArgument = '';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureNoExpected(expected, matcherName, options);
    ensureMock(received, matcherName, expectedArgument, options);

    const receivedIsSpy = isSpy(received);
    const receivedName = receivedIsSpy ? 'spy' : received.getMockName();
    const count = receivedIsSpy
      ? received.calls.count()
      : received.mock.calls.length;
    const calls = receivedIsSpy
      ? received.calls.all().map((x: any) => x.args)
      : received.mock.calls;
    const pass = count > 0;
    const message = pass
      ? () =>
          matcherHint(matcherName, receivedName, expectedArgument, options) +
          '\n\n' +
          `Expected number of calls: ${printExpected(0)}\n` +
          `Received number of calls: ${printReceived(count)}\n\n` +
          calls
            .reduce((lines: Array<string>, args: any, i: number) => {
              if (lines.length < PRINT_LIMIT) {
                lines.push(`${i + 1}: ${printReceivedArgs(args)}`);
              }

              return lines;
            }, [])
            .join('\n')
      : () =>
          matcherHint(matcherName, receivedName, expectedArgument, options) +
          '\n\n' +
          `Expected number of calls: >= ${printExpected(1)}\n` +
          `Received number of calls:    ${printReceived(count)}`;

    return {message, pass};
  };

const createToReturnMatcher = (matcherName: string) =>
  function(
    this: MatcherState,
    received: any,
    expected: unknown,
  ): SyncExpectationResult {
    const expectedArgument = '';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureNoExpected(expected, matcherName, options);
    ensureMock(received, matcherName, expectedArgument, options);

    const receivedName = received.getMockName();

    // Count return values that correspond only to calls that returned
    const count = received.mock.results.reduce(
      (n: number, result: any) => (result.type === 'return' ? n + 1 : n),
      0,
    );

    const pass = count > 0;

    const message = pass
      ? () =>
          matcherHint(matcherName, receivedName, expectedArgument, options) +
          '\n\n' +
          `Expected number of returns: ${printExpected(0)}\n` +
          `Received number of returns: ${printReceived(count)}\n\n` +
          received.mock.results
            .reduce((lines: Array<string>, result: any, i: number) => {
              if (result.type === 'return' && lines.length < PRINT_LIMIT) {
                lines.push(`${i + 1}: ${printReceived(result.value)}`);
              }

              return lines;
            }, [])
            .join('\n') +
          (received.mock.calls.length !== count
            ? `\n\nReceived number of calls:   ${printReceived(
                received.mock.calls.length,
              )}`
            : '')
      : () =>
          matcherHint(matcherName, receivedName, expectedArgument, options) +
          '\n\n' +
          `Expected number of returns: >= ${printExpected(1)}\n` +
          `Received number of returns:    ${printReceived(count)}` +
          (received.mock.calls.length !== count
            ? `\nReceived number of calls:      ${printReceived(
                received.mock.calls.length,
              )}`
            : '');

    return {message, pass};
  };

const createToBeCalledTimesMatcher = (matcherName: string) =>
  function(
    this: MatcherState,
    received: any,
    expected: number,
  ): SyncExpectationResult {
    const expectedArgument = 'expected';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureExpectedIsNonNegativeInteger(expected, matcherName, options);
    ensureMock(received, matcherName, expectedArgument, options);

    const receivedIsSpy = isSpy(received);
    const receivedName = receivedIsSpy ? 'spy' : received.getMockName();
    const count = receivedIsSpy
      ? received.calls.count()
      : received.mock.calls.length;

    const pass = count === expected;

    const message = pass
      ? () =>
          matcherHint(matcherName, receivedName, expectedArgument, options) +
          `\n\n` +
          `Expected number of calls: not ${printExpected(expected)}`
      : () =>
          matcherHint(matcherName, receivedName, expectedArgument, options) +
          '\n\n' +
          `Expected number of calls: ${printExpected(expected)}\n` +
          `Received number of calls: ${printReceived(count)}`;

    return {message, pass};
  };

const createToReturnTimesMatcher = (matcherName: string) =>
  function(
    this: MatcherState,
    received: any,
    expected: number,
  ): SyncExpectationResult {
    const expectedArgument = 'expected';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureExpectedIsNonNegativeInteger(expected, matcherName, options);
    ensureMock(received, matcherName, expectedArgument, options);

    const receivedName = received.getMockName();

    // Count return values that correspond only to calls that returned
    const count = received.mock.results.reduce(
      (n: number, result: any) => (result.type === 'return' ? n + 1 : n),
      0,
    );

    const pass = count === expected;

    const message = pass
      ? () =>
          matcherHint(matcherName, receivedName, expectedArgument, options) +
          `\n\n` +
          `Expected number of returns: not ${printExpected(expected)}` +
          (received.mock.calls.length !== count
            ? `\n\nReceived number of calls:       ${printReceived(
                received.mock.calls.length,
              )}`
            : '')
      : () =>
          matcherHint(matcherName, receivedName, expectedArgument, options) +
          '\n\n' +
          `Expected number of returns: ${printExpected(expected)}\n` +
          `Received number of returns: ${printReceived(count)}` +
          (received.mock.calls.length !== count
            ? `\nReceived number of calls:   ${printReceived(
                received.mock.calls.length,
              )}`
            : '');

    return {message, pass};
  };

const createToBeCalledWithMatcher = (matcherName: string) =>
  function(
    this: MatcherState,
    received: any,
    ...expected: Array<unknown>
  ): SyncExpectationResult {
    const expectedArgument = '...expected';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureMock(received, matcherName.slice(1), expectedArgument, options);

    const receivedIsSpy = isSpy(received);
    const type = receivedIsSpy ? 'spy' : 'mock function';
    const receivedName = receivedIsSpy ? 'spy' : received.getMockName();
    const identifier =
      receivedIsSpy || receivedName === 'jest.fn()'
        ? type
        : `${type} "${receivedName}"`;

    const calls = receivedIsSpy
      ? received.calls.all().map((x: any) => x.args)
      : received.mock.calls;

    const [match, fail] = partition(calls, call =>
      equals(call, expected, [iterableEquality]),
    );
    const pass = match.length > 0;

    const message = pass
      ? () =>
          matcherHint('.not' + matcherName, receivedName) +
          '\n\n' +
          `Expected ${identifier} not to have been called with:\n` +
          `  ${printExpected(expected)}`
      : () =>
          matcherHint(matcherName, receivedName) +
          '\n\n' +
          `Expected ${identifier} to have been called with:\n` +
          formatMismatchedCalls(fail, expected, CALL_PRINT_LIMIT);

    return {message, pass};
  };

const createToReturnWithMatcher = (matcherName: string) =>
  function(
    this: MatcherState,
    received: any,
    expected: unknown,
  ): SyncExpectationResult {
    const expectedArgument = 'expected';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureMock(received, matcherName.slice(1), expectedArgument, options);

    const receivedName = received.getMockName();
    const identifier =
      receivedName === 'jest.fn()'
        ? 'mock function'
        : `mock function "${receivedName}"`;

    // List of return values that correspond only to calls that returned
    const returnValues = received.mock.results
      .filter((result: any) => result.type === 'return')
      .map((result: any) => result.value);

    const [match] = partition(returnValues, value =>
      equals(expected, value, [iterableEquality]),
    );
    const pass = match.length > 0;

    const message = pass
      ? () =>
          matcherHint('.not' + matcherName, receivedName) +
          '\n\n' +
          `Expected ${identifier} not to have returned:\n` +
          `  ${printExpected(expected)}\n` +
          `But it returned exactly:\n` +
          `  ${printReceived(expected)}`
      : () =>
          matcherHint(matcherName, receivedName) +
          '\n\n' +
          `Expected ${identifier} to have returned:\n` +
          formatMismatchedReturnValues(
            returnValues,
            expected,
            RETURN_PRINT_LIMIT,
          );

    return {message, pass};
  };

const createLastCalledWithMatcher = (matcherName: string) =>
  function(
    this: MatcherState,
    received: any,
    ...expected: Array<unknown>
  ): SyncExpectationResult {
    const expectedArgument = '...expected';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureMock(received, matcherName.slice(1), expectedArgument, options);

    const receivedIsSpy = isSpy(received);
    const type = receivedIsSpy ? 'spy' : 'mock function';
    const receivedName = receivedIsSpy ? 'spy' : received.getMockName();
    const identifier =
      receivedIsSpy || receivedName === 'jest.fn()'
        ? type
        : `${type} "${receivedName}"`;
    const calls = receivedIsSpy
      ? received.calls.all().map((x: any) => x.args)
      : received.mock.calls;
    const pass = equals(calls[calls.length - 1], expected, [iterableEquality]);

    const message = pass
      ? () =>
          matcherHint('.not' + matcherName, receivedName) +
          '\n\n' +
          `Expected ${identifier} to not have been last called with:\n` +
          `  ${printExpected(expected)}`
      : () =>
          matcherHint(matcherName, receivedName) +
          '\n\n' +
          `Expected ${identifier} to have been last called with:\n` +
          formatMismatchedCalls(calls, expected, LAST_CALL_PRINT_LIMIT);

    return {message, pass};
  };

const createLastReturnedMatcher = (matcherName: string) =>
  function(
    this: MatcherState,
    received: any,
    expected: unknown,
  ): SyncExpectationResult {
    const expectedArgument = 'expected';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureMock(received, matcherName.slice(1), expectedArgument, options);

    const receivedName = received.getMockName();
    const identifier =
      receivedName === 'jest.fn()'
        ? 'mock function'
        : `mock function "${receivedName}"`;

    const results = received.mock.results;
    const lastResult = results[results.length - 1];
    const pass =
      !!lastResult &&
      lastResult.type === 'return' &&
      equals(lastResult.value, expected, [iterableEquality]);

    const message = pass
      ? () =>
          matcherHint('.not' + matcherName, receivedName) +
          '\n\n' +
          `Expected ${identifier} to not have last returned:\n` +
          `  ${printExpected(expected)}\n` +
          `But it last returned exactly:\n` +
          `  ${printReceived(lastResult.value)}`
      : () =>
          matcherHint(matcherName, receivedName) +
          '\n\n' +
          `Expected ${identifier} to have last returned:\n` +
          `  ${printExpected(expected)}\n` +
          (!lastResult
            ? `But it was ${RECEIVED_COLOR('not called')}`
            : lastResult.type === 'incomplete'
            ? `But the last call ${RECEIVED_COLOR('has not returned yet')}`
            : lastResult.type === 'throw'
            ? `But the last call ${RECEIVED_COLOR('threw an error')}`
            : `But the last call returned:\n  ${printReceived(
                lastResult.value,
              )}`);

    return {message, pass};
  };

const createNthCalledWithMatcher = (matcherName: string) =>
  function(
    this: MatcherState,
    received: any,
    nth: number,
    ...expected: Array<unknown>
  ): SyncExpectationResult {
    const expectedArgument = 'n';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
      secondArgument: '...expected',
    };
    ensureMock(received, matcherName.slice(1), expectedArgument, options);

    if (!Number.isSafeInteger(nth) || nth < 1) {
      throw new Error(
        matcherErrorMessage(
          matcherHint(
            matcherName.slice(1),
            undefined,
            expectedArgument,
            options,
          ),
          `${EXPECTED_COLOR(expectedArgument)} must be a positive integer`,
          printWithType(expectedArgument, nth, printExpected),
        ),
      );
    }

    const receivedIsSpy = isSpy(received);
    const type = receivedIsSpy ? 'spy' : 'mock function';

    const receivedName = receivedIsSpy ? 'spy' : received.getMockName();
    const identifier =
      receivedIsSpy || receivedName === 'jest.fn()'
        ? type
        : `${type} "${receivedName}"`;
    const calls = receivedIsSpy
      ? received.calls.all().map((x: any) => x.args)
      : received.mock.calls;
    const pass = equals(calls[nth - 1], expected, [iterableEquality]);

    const message = pass
      ? () =>
          matcherHint('.not' + matcherName, receivedName) +
          '\n\n' +
          `Expected ${identifier} ${nthToString(
            nth,
          )} call to not have been called with:\n` +
          `  ${printExpected(expected)}`
      : () =>
          matcherHint(matcherName, receivedName) +
          '\n\n' +
          `Expected ${identifier} ${nthToString(
            nth,
          )} call to have been called with:\n` +
          formatMismatchedCalls(
            calls[nth - 1] ? [calls[nth - 1]] : [],
            expected,
            LAST_CALL_PRINT_LIMIT,
          );

    return {message, pass};
  };

const createNthReturnedWithMatcher = (matcherName: string) =>
  function(
    this: MatcherState,
    received: any,
    nth: number,
    expected: unknown,
  ): SyncExpectationResult {
    const expectedArgument = 'n';
    const options: MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
      secondArgument: 'expected',
    };
    ensureMock(received, matcherName.slice(1), expectedArgument, options);

    if (!Number.isSafeInteger(nth) || nth < 1) {
      throw new Error(
        matcherErrorMessage(
          matcherHint(
            matcherName.slice(1),
            undefined,
            expectedArgument,
            options,
          ),
          `${EXPECTED_COLOR(expectedArgument)} must be a positive integer`,
          printWithType(expectedArgument, nth, printExpected),
        ),
      );
    }

    const receivedName = received.getMockName();
    const identifier =
      receivedName === 'jest.fn()'
        ? 'mock function'
        : `mock function "${receivedName}"`;

    const results = received.mock.results;
    const nthResult = results[nth - 1];
    const pass =
      !!nthResult &&
      nthResult.type === 'return' &&
      equals(nthResult.value, expected, [iterableEquality]);
    const nthString = nthToString(nth);
    const message = pass
      ? () =>
          matcherHint('.not' + matcherName, receivedName) +
          '\n\n' +
          `Expected ${identifier} ${nthString} call to not have returned with:\n` +
          `  ${printExpected(expected)}\n` +
          `But the ${nthString} call returned exactly:\n` +
          `  ${printReceived(nthResult.value)}`
      : () =>
          matcherHint(matcherName, receivedName) +
          '\n\n' +
          `Expected ${identifier} ${nthString} call to have returned with:\n` +
          `  ${printExpected(expected)}\n` +
          (results.length === 0
            ? `But it was ${RECEIVED_COLOR('not called')}`
            : nth > results.length
            ? `But it was only called ${printReceived(results.length)} times`
            : nthResult.type === 'incomplete'
            ? `But the ${nthString} call ${RECEIVED_COLOR(
                'has not returned yet',
              )}`
            : nthResult.type === 'throw'
            ? `But the ${nthString} call ${RECEIVED_COLOR('threw an error')}`
            : `But the ${nthString} call returned with:\n  ${printReceived(
                nthResult.value,
              )}`);

    return {message, pass};
  };

const spyMatchers: MatchersObject = {
  lastCalledWith: createLastCalledWithMatcher('.lastCalledWith'),
  lastReturnedWith: createLastReturnedMatcher('.lastReturnedWith'),
  nthCalledWith: createNthCalledWithMatcher('.nthCalledWith'),
  nthReturnedWith: createNthReturnedWithMatcher('.nthReturnedWith'),
  toBeCalled: createToBeCalledMatcher('toBeCalled'),
  toBeCalledTimes: createToBeCalledTimesMatcher('toBeCalledTimes'),
  toBeCalledWith: createToBeCalledWithMatcher('.toBeCalledWith'),
  toHaveBeenCalled: createToBeCalledMatcher('toHaveBeenCalled'),
  toHaveBeenCalledTimes: createToBeCalledTimesMatcher('toHaveBeenCalledTimes'),
  toHaveBeenCalledWith: createToBeCalledWithMatcher('.toHaveBeenCalledWith'),
  toHaveBeenLastCalledWith: createLastCalledWithMatcher(
    '.toHaveBeenLastCalledWith',
  ),
  toHaveBeenNthCalledWith: createNthCalledWithMatcher(
    '.toHaveBeenNthCalledWith',
  ),
  toHaveLastReturnedWith: createLastReturnedMatcher('.toHaveLastReturnedWith'),
  toHaveNthReturnedWith: createNthReturnedWithMatcher('.toHaveNthReturnedWith'),
  toHaveReturned: createToReturnMatcher('toHaveReturned'),
  toHaveReturnedTimes: createToReturnTimesMatcher('toHaveReturnedTimes'),
  toHaveReturnedWith: createToReturnWithMatcher('.toHaveReturnedWith'),
  toReturn: createToReturnMatcher('toReturn'),
  toReturnTimes: createToReturnTimesMatcher('toReturnTimes'),
  toReturnWith: createToReturnWithMatcher('.toReturnWith'),
};

const isSpy = (spy: any) => spy.calls && typeof spy.calls.count === 'function';

const ensureMock = (
  received: any,
  matcherName: string,
  expectedArgument: string,
  options: MatcherHintOptions,
) => {
  if (
    !received ||
    ((received.calls === undefined || received.calls.all === undefined) &&
      received._isMockFunction !== true)
  ) {
    throw new Error(
      matcherErrorMessage(
        matcherHint(matcherName, undefined, expectedArgument, options),
        `${RECEIVED_COLOR('received')} value must be a mock or spy function`,
        printWithType('Received', received, printReceived),
      ),
    );
  }
};

const getPrintedCalls = (
  calls: Array<any>,
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

const getPrintedReturnValues = (calls: Array<any>, limit: number): string => {
  const result = [];

  for (let i = 0; i < calls.length && i < limit; i += 1) {
    result.push(printReceived(calls[i]));
  }

  if (calls.length > limit) {
    result.push(`...and ${printReceived(calls.length - limit)} more`);
  }

  return result.join('\n\n  ');
};

const formatMismatchedCalls = (
  calls: Array<any>,
  expected: any,
  limit: number,
): string => {
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

const formatMismatchedReturnValues = (
  returnValues: Array<any>,
  expected: any,
  limit: number,
): string => {
  if (returnValues.length) {
    return (
      `  ${printExpected(expected)}\n` +
      `But it returned:\n` +
      `  ${getPrintedReturnValues(returnValues, limit)}`
    );
  } else {
    return (
      `  ${printExpected(expected)}\n` +
      `But it did ${RECEIVED_COLOR('not return')}.`
    );
  }
};

const formatMismatchedArgs = (expected: any, received: any): string => {
  const length = Math.max(expected.length, received.length);

  const printedArgs = [];
  for (let i = 0; i < length; i++) {
    if (!equals(expected[i], received[i], [iterableEquality])) {
      const oneline = isOneline(expected[i], received[i]);
      const diffString = diff(expected[i], received[i]);
      printedArgs.push(
        `  ${printExpected(expected[i])}\n` +
          `as argument ${i + 1}, but it was called with\n` +
          `  ${printReceived(received[i])}.` +
          (diffString && !oneline ? `\n\nDifference:\n\n${diffString}` : ''),
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

const nthToString = (nth: number): string => {
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
