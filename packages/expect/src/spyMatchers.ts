/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  diff,
  ensureExpectedIsNumber,
  ensureNoExpected,
  EXPECTED_COLOR,
  matcherErrorMessage,
  matcherHint,
  MatcherHintOptions,
  printExpected,
  printReceived,
  printWithType,
  RECEIVED_COLOR,
  stringify,
} from 'jest-matcher-utils';
import {MatchersObject, MatcherState, SyncExpectationResult} from './types';
import {equals} from './jasmineUtils';
import {iterableEquality, partition, isOneline} from './utils';

const PRINT_LIMIT = 3;
const CALL_PRINT_LIMIT = 3;
const LAST_CALL_PRINT_LIMIT = 1;

const printReceivedArgs = (args: Array<unknown>): string =>
  args.length === 0
    ? 'called with no arguments'
    : args.map(arg => printReceived(arg)).join(', ');

const isEqualReturn = (expected: unknown, result: any): boolean =>
  result.type === 'return' &&
  equals(expected, result.value, [iterableEquality]);

const countReturns = (results: Array<any>): number =>
  results.reduce(
    (n: number, result: any) => (result.type === 'return' ? n + 1 : n),
    0,
  );

const printNumberOfReturns = (
  countReturns: number,
  countCalls: number,
): string =>
  `\nNumber of returns: ${printReceived(countReturns)}` +
  (countCalls !== countReturns
    ? `\nNumber of calls:   ${printReceived(countCalls)}`
    : '');

type PrintLabel = (string: string, isExpectedCall: boolean) => string;

// Given a label, return a function which given a string,
// right-aligns it preceding the colon in the label.
const getRightAlignedPrinter = (label: string): PrintLabel => {
  // Assume that the label contains a colon.
  const index = label.indexOf(':');
  const suffix = label.slice(index);

  return (string: string, isExpectedCall: boolean) =>
    (isExpectedCall
      ? '->' + ' '.repeat(Math.max(0, index - 2 - string.length))
      : ' '.repeat(Math.max(index - string.length))) +
    string +
    suffix;
};

const printResult = (result: any) =>
  result.type === 'throw'
    ? 'function call threw an error'
    : result.type === 'incomplete'
    ? 'function call has not returned yet'
    : printReceived(result.value);

type IndexedResult = [number, any];

// Return either empty string or one line per indexed result,
// so additional empty line can separate from `Number of returns` which follows.
const printReceivedResults = (
  label: string,
  indexedResults: Array<IndexedResult>,
  isOnlyCall: boolean,
  iExpectedCall?: number,
) => {
  if (indexedResults.length === 0) {
    return '';
  }

  if (isOnlyCall) {
    return label + printResult(indexedResults[0][1]) + '\n';
  }

  const printAligned = getRightAlignedPrinter(label);

  return (
    label.replace(':', '').trim() +
    '\n' +
    indexedResults.reduce(
      (printed: string, [i, result]: IndexedResult) =>
        printed +
        printAligned(String(i + 1), i === iExpectedCall) +
        printResult(result) +
        '\n',
      '',
    )
  );
};

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
    ensureMockOrSpy(received, matcherName, expectedArgument, options);

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
    ensureExpectedIsNumber(expected, matcherName, options);
    ensureMockOrSpy(received, matcherName, expectedArgument, options);

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
    ensureExpectedIsNumber(expected, matcherName, options);
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
    ensureMockOrSpy(received, matcherName.slice(1), expectedArgument, options);

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
    ensureMock(received, matcherName, expectedArgument, options);

    const receivedName = received.getMockName();
    const {calls, results} = received.mock;

    const pass = results.some((result: any) => isEqualReturn(expected, result));

    const message = pass
      ? () => {
          // Some examples of results that are equal to expected value.
          const indexedResults: Array<IndexedResult> = [];
          let i = 0;
          while (i < results.length && indexedResults.length < PRINT_LIMIT) {
            if (isEqualReturn(expected, results[i])) {
              indexedResults.push([i, results[i]]);
            }
            i += 1;
          }

          return (
            matcherHint(matcherName, receivedName, expectedArgument, options) +
            '\n\n' +
            `Expected: not ${printExpected(expected)}\n` +
            (results.length === 1 &&
            results[0].type === 'return' &&
            stringify(results[0].value) === stringify(expected)
              ? ''
              : printReceivedResults(
                  'Received:     ',
                  indexedResults,
                  results.length === 1,
                )) +
            printNumberOfReturns(countReturns(results), calls.length)
          );
        }
      : () => {
          // Some examples of results that are not equal to expected value.
          const indexedResults: Array<IndexedResult> = [];
          let i = 0;
          while (i < results.length && indexedResults.length < PRINT_LIMIT) {
            indexedResults.push([i, results[i]]);
            i += 1;
          }

          return (
            matcherHint(matcherName, receivedName, expectedArgument, options) +
            '\n\n' +
            `Expected: ${printExpected(expected)}\n` +
            printReceivedResults(
              'Received: ',
              indexedResults,
              results.length === 1,
            ) +
            printNumberOfReturns(countReturns(results), calls.length)
          );
        };

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
    ensureMockOrSpy(received, matcherName.slice(1), expectedArgument, options);

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
    ensureMock(received, matcherName, expectedArgument, options);

    const receivedName = received.getMockName();

    const {calls, results} = received.mock;
    const iLast = results.length - 1;

    const pass = iLast >= 0 && isEqualReturn(expected, results[iLast]);

    const message = pass
      ? () => {
          const indexedResults: Array<IndexedResult> = [];
          if (iLast > 0) {
            // Display preceding result as context.
            indexedResults.push([iLast - 1, results[iLast - 1]]);
          }
          indexedResults.push([iLast, results[iLast]]);

          return (
            matcherHint(matcherName, receivedName, expectedArgument, options) +
            '\n\n' +
            `Expected: not ${printExpected(expected)}\n` +
            (results.length === 1 &&
            results[0].type === 'return' &&
            stringify(results[0].value) === stringify(expected)
              ? ''
              : printReceivedResults(
                  'Received:     ',
                  indexedResults,
                  results.length === 1,
                  iLast,
                )) +
            printNumberOfReturns(countReturns(results), calls.length)
          );
        }
      : () => {
          const indexedResults: Array<IndexedResult> = [];
          if (iLast >= 0) {
            if (iLast > 0) {
              let i = iLast - 1;
              // Is there a preceding result that is equal to expected value?
              while (i >= 0 && !isEqualReturn(expected, results[i])) {
                i -= 1;
              }
              if (i < 0) {
                i = iLast - 1; // otherwise, preceding result
              }

              indexedResults.push([i, results[i]]);
            }

            indexedResults.push([iLast, results[iLast]]);
          }

          return (
            matcherHint(matcherName, receivedName, expectedArgument, options) +
            '\n\n' +
            `Expected: ${printExpected(expected)}\n` +
            printReceivedResults(
              'Received: ',
              indexedResults,
              results.length === 1,
              iLast,
            ) +
            printNumberOfReturns(countReturns(results), calls.length)
          );
        };

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
    ensureMockOrSpy(received, matcherName.slice(1), expectedArgument, options);

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
    ensureMock(received, matcherName, expectedArgument, options);

    if (!Number.isSafeInteger(nth) || nth < 1) {
      throw new Error(
        matcherErrorMessage(
          matcherHint(matcherName, undefined, expectedArgument, options),
          `${EXPECTED_COLOR(expectedArgument)} must be a positive integer`,
          printWithType(expectedArgument, nth, printExpected),
        ),
      );
    }

    const receivedName = received.getMockName();
    const {calls, results} = received.mock;
    const length = results.length;
    const iNth = nth - 1;

    const pass = iNth < length && isEqualReturn(expected, results[iNth]);

    const message = pass
      ? () => {
          // Display preceding and following results,
          // in case assertions fails because index is off by one.
          const indexedResults: Array<IndexedResult> = [];
          if (iNth - 1 >= 0) {
            indexedResults.push([iNth - 1, results[iNth - 1]]);
          }
          indexedResults.push([iNth, results[iNth]]);
          if (iNth + 1 < length) {
            indexedResults.push([iNth + 1, results[iNth + 1]]);
          }

          return (
            matcherHint(matcherName, receivedName, expectedArgument, options) +
            '\n\n' +
            `n: ${nth}\n` +
            `Expected: not ${printExpected(expected)}\n` +
            (results.length === 1 &&
            results[0].type === 'return' &&
            stringify(results[0].value) === stringify(expected)
              ? ''
              : printReceivedResults(
                  'Received:     ',
                  indexedResults,
                  results.length === 1,
                  iNth,
                )) +
            printNumberOfReturns(countReturns(results), calls.length)
          );
        }
      : () => {
          // Display preceding and following results:
          // * nearest result that is equal to expected value
          // * otherwise, adjacent result
          // in case assertions fails because of index, especially off by one.
          const indexedResults: Array<IndexedResult> = [];
          if (iNth < length) {
            if (iNth - 1 >= 0) {
              let i = iNth - 1;
              // Is there a preceding result that is equal to expected value?
              while (i >= 0 && !isEqualReturn(expected, results[i])) {
                i -= 1;
              }
              if (i < 0) {
                i = iNth - 1; // otherwise, adjacent result
              }

              indexedResults.push([i, results[i]]);
            }
            indexedResults.push([iNth, results[iNth]]);
            if (iNth + 1 < length) {
              let i = iNth + 1;
              // Is there a following result that is equal to expected value?
              while (i < length && !isEqualReturn(expected, results[i])) {
                i += 1;
              }
              if (i >= length) {
                i = iNth + 1; // otherwise, adjacent result
              }

              indexedResults.push([i, results[i]]);
            }
          } else if (length > 0) {
            // The number of received calls is fewer than the expected number.
            let i = length - 1;
            // Is there a result that is equal to expected value?
            while (i >= 0 && !isEqualReturn(expected, results[i])) {
              i -= 1;
            }
            if (i < 0) {
              i = length - 1; // otherwise, last result
            }

            indexedResults.push([i, results[i]]);
          }

          return (
            matcherHint(matcherName, receivedName, expectedArgument, options) +
            '\n\n' +
            `n: ${nth}\n` +
            `Expected: ${printExpected(expected)}\n` +
            printReceivedResults(
              'Received: ',
              indexedResults,
              results.length === 1,
              iNth,
            ) +
            printNumberOfReturns(countReturns(results), calls.length)
          );
        };

    return {message, pass};
  };

const spyMatchers: MatchersObject = {
  lastCalledWith: createLastCalledWithMatcher('.lastCalledWith'),
  lastReturnedWith: createLastReturnedMatcher('lastReturnedWith'),
  nthCalledWith: createNthCalledWithMatcher('.nthCalledWith'),
  nthReturnedWith: createNthReturnedWithMatcher('nthReturnedWith'),
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
  toHaveLastReturnedWith: createLastReturnedMatcher('toHaveLastReturnedWith'),
  toHaveNthReturnedWith: createNthReturnedWithMatcher('toHaveNthReturnedWith'),
  toHaveReturned: createToReturnMatcher('toHaveReturned'),
  toHaveReturnedTimes: createToReturnTimesMatcher('toHaveReturnedTimes'),
  toHaveReturnedWith: createToReturnWithMatcher('toHaveReturnedWith'),
  toReturn: createToReturnMatcher('toReturn'),
  toReturnTimes: createToReturnTimesMatcher('toReturnTimes'),
  toReturnWith: createToReturnWithMatcher('toReturnWith'),
};

const isMock = (received: any) =>
  received != null && received._isMockFunction === true;

const isSpy = (received: any) =>
  received != null &&
  received.calls != null &&
  typeof received.calls.all === 'function' &&
  typeof received.calls.count === 'function';

const ensureMockOrSpy = (
  received: any,
  matcherName: string,
  expectedArgument: string,
  options: MatcherHintOptions,
) => {
  if (!isMock(received) && !isSpy(received)) {
    throw new Error(
      matcherErrorMessage(
        matcherHint(matcherName, undefined, expectedArgument, options),
        `${RECEIVED_COLOR('received')} value must be a mock or spy function`,
        printWithType('Received', received, printReceived),
      ),
    );
  }
};

const ensureMock = (
  received: any,
  matcherName: string,
  expectedArgument: string,
  options: MatcherHintOptions,
) => {
  if (!isMock(received)) {
    throw new Error(
      matcherErrorMessage(
        matcherHint(matcherName, undefined, expectedArgument, options),
        `${RECEIVED_COLOR('received')} value must be a mock function`,
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
