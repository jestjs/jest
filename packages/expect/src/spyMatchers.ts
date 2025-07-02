/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable unicorn/consistent-function-scoping */

import {equals, iterableEquality} from '@jest/expect-utils';
import {getType, isPrimitive} from '@jest/get-type';
import type * as MatcherUtils from 'jest-matcher-utils';
import {getCustomEqualityTesters} from './jestMatchersObject';
import type {
  MatcherFunction,
  MatchersObject,
  SyncExpectationResult,
} from './types';

// The optional property of matcher context is true if undefined.
const isExpand = (expand?: boolean): boolean => expand !== false;

const PRINT_LIMIT = 3;

const NO_ARGUMENTS = 'called with 0 arguments';

const printExpectedArgs = (
  utils: typeof MatcherUtils,
  expected: Array<unknown>,
): string =>
  expected.length === 0
    ? NO_ARGUMENTS
    : expected.map(arg => utils.printExpected(arg)).join(', ');

const printReceivedArgs = (
  utils: typeof MatcherUtils,
  received: Array<unknown>,
  expected?: Array<unknown>,
): string =>
  received.length === 0
    ? NO_ARGUMENTS
    : received
        .map((arg, i) =>
          Array.isArray(expected) &&
          i < expected.length &&
          isEqualValue(expected[i], arg)
            ? printCommon(utils, arg)
            : utils.printReceived(arg),
        )
        .join(', ');

const printCommon = (utils: typeof MatcherUtils, val: unknown) =>
  utils.DIM_COLOR(utils.stringify(val));

const isEqualValue = (expected: unknown, received: unknown): boolean =>
  equals(expected, received, [...getCustomEqualityTesters(), iterableEquality]);

const isEqualCall = (
  expected: Array<unknown>,
  received: Array<unknown>,
): boolean =>
  received.length === expected.length && isEqualValue(expected, received);

const isEqualReturn = (expected: unknown, result: any): boolean =>
  result.type === 'return' && isEqualValue(expected, result.value);

const countReturns = (results: Array<any>): number =>
  results.reduce(
    (n: number, result: any) => (result.type === 'return' ? n + 1 : n),
    0,
  );

const printNumberOfReturns = (
  utils: typeof MatcherUtils,
  countReturns: number,
  countCalls: number,
): string =>
  `\nNumber of returns: ${utils.printReceived(countReturns)}${
    countCalls === countReturns
      ? ''
      : `\nNumber of calls:   ${utils.printReceived(countCalls)}`
  }`;

type PrintLabel = (string: string, isExpectedCall: boolean) => string;

// Given a label, return a function which given a string,
// right-aligns it preceding the colon in the label.
const getRightAlignedPrinter = (label: string): PrintLabel => {
  // Assume that the label contains a colon.
  const index = label.indexOf(':');
  const suffix = label.slice(index);

  return (string: string, isExpectedCall: boolean) =>
    (isExpectedCall
      ? `->${' '.repeat(Math.max(0, index - 2 - string.length))}`
      : ' '.repeat(Math.max(index - string.length))) +
    string +
    suffix;
};

type IndexedCall = [number, Array<unknown>];

const printReceivedCallsNegative = (
  utils: typeof MatcherUtils,
  expected: Array<unknown>,
  indexedCalls: Array<IndexedCall>,
  isOnlyCall: boolean,
  iExpectedCall?: number,
) => {
  if (indexedCalls.length === 0) {
    return '';
  }

  const label = 'Received:     ';
  if (isOnlyCall) {
    return `${label + printReceivedArgs(utils, indexedCalls[0], expected)}\n`;
  }

  const printAligned = getRightAlignedPrinter(label);

  return `Received\n${indexedCalls.reduce(
    (printed: string, [i, args]: IndexedCall) =>
      `${
        printed +
        printAligned(String(i + 1), i === iExpectedCall) +
        printReceivedArgs(utils, args, expected)
      }\n`,
    '',
  )}`;
};

const printExpectedReceivedCallsPositive = (
  utils: typeof MatcherUtils,
  expected: Array<unknown>,
  indexedCalls: Array<IndexedCall>,
  expand: boolean,
  isOnlyCall: boolean,
  iExpectedCall?: number,
) => {
  const expectedLine = `Expected: ${printExpectedArgs(utils, expected)}\n`;
  if (indexedCalls.length === 0) {
    return expectedLine;
  }

  const label = 'Received: ';
  if (isOnlyCall && (iExpectedCall === 0 || iExpectedCall === undefined)) {
    const received = indexedCalls[0][1];

    if (isLineDiffableCall(expected, received)) {
      // Display diff without indentation.
      const lines = [
        utils.EXPECTED_COLOR('- Expected'),
        utils.RECEIVED_COLOR('+ Received'),
        '',
      ];

      const length = Math.max(expected.length, received.length);
      for (let i = 0; i < length; i += 1) {
        if (i < expected.length && i < received.length) {
          if (isEqualValue(expected[i], received[i])) {
            lines.push(`  ${printCommon(utils, received[i])},`);
            continue;
          }

          if (isLineDiffableArg(expected[i], received[i])) {
            const difference = utils.diff(expected[i], received[i], {expand});
            if (
              typeof difference === 'string' &&
              difference.includes('- Expected') &&
              difference.includes('+ Received')
            ) {
              // Omit annotation in case multiple args have diff.
              lines.push(`${difference.split('\n').slice(3).join('\n')},`);
              continue;
            }
          }
        }

        if (i < expected.length) {
          lines.push(
            `${utils.EXPECTED_COLOR(`- ${utils.stringify(expected[i])}`)},`,
          );
        }
        if (i < received.length) {
          lines.push(
            `${utils.RECEIVED_COLOR(`+ ${utils.stringify(received[i])}`)},`,
          );
        }
      }

      return `${lines.join('\n')}\n`;
    }

    return `${
      expectedLine + label + printReceivedArgs(utils, received, expected)
    }\n`;
  }

  const printAligned = getRightAlignedPrinter(label);

  return (
    // eslint-disable-next-line prefer-template
    expectedLine +
    'Received\n' +
    indexedCalls.reduce((printed: string, [i, received]: IndexedCall) => {
      const aligned = printAligned(String(i + 1), i === iExpectedCall);
      return `${
        printed +
        ((i === iExpectedCall || iExpectedCall === undefined) &&
        isLineDiffableCall(expected, received)
          ? aligned.replace(': ', '\n') +
            printDiffCall(utils, expected, received, expand)
          : aligned + printReceivedArgs(utils, received, expected))
      }\n`;
    }, '')
  );
};

const indentation = 'Received'.replaceAll(/\w/g, ' ');

const printDiffCall = (
  utils: typeof MatcherUtils,
  expected: Array<unknown>,
  received: Array<unknown>,
  expand: boolean,
) =>
  received
    .map((arg, i) => {
      if (i < expected.length) {
        if (isEqualValue(expected[i], arg)) {
          return `${indentation}  ${printCommon(utils, arg)},`;
        }

        if (isLineDiffableArg(expected[i], arg)) {
          const difference = utils.diff(expected[i], arg, {expand});

          if (
            typeof difference === 'string' &&
            difference.includes('- Expected') &&
            difference.includes('+ Received')
          ) {
            // Display diff with indentation.
            // Omit annotation in case multiple args have diff.
            return `${difference
              .split('\n')
              .slice(3)
              .map(line => indentation + line)
              .join('\n')},`;
          }
        }
      }

      // Display + only if received arg has no corresponding expected arg.
      return `${
        indentation +
        (i < expected.length
          ? `  ${utils.printReceived(arg)}`
          : utils.RECEIVED_COLOR(`+ ${utils.stringify(arg)}`))
      },`;
    })
    .join('\n');

const isLineDiffableCall = (
  expected: Array<unknown>,
  received: Array<unknown>,
): boolean =>
  expected.some(
    (arg, i) => i < received.length && isLineDiffableArg(arg, received[i]),
  );

// Almost redundant with function in jest-matcher-utils,
// except no line diff for any strings.
const isLineDiffableArg = (expected: unknown, received: unknown): boolean => {
  const expectedType = getType(expected);
  const receivedType = getType(received);

  if (expectedType !== receivedType) {
    return false;
  }

  if (isPrimitive(expected)) {
    return false;
  }

  if (
    expectedType === 'date' ||
    expectedType === 'function' ||
    expectedType === 'regexp'
  ) {
    return false;
  }

  if (expected instanceof Error && received instanceof Error) {
    return false;
  }

  if (
    expectedType === 'object' &&
    typeof (expected as any).asymmetricMatch === 'function'
  ) {
    return false;
  }

  if (
    receivedType === 'object' &&
    typeof (received as any).asymmetricMatch === 'function'
  ) {
    return false;
  }

  return true;
};

const printResult = (
  utils: typeof MatcherUtils,
  result: any,
  expected: unknown,
) =>
  result.type === 'throw'
    ? 'function call threw an error'
    : result.type === 'incomplete'
      ? 'function call has not returned yet'
      : isEqualValue(expected, result.value)
        ? printCommon(utils, result.value)
        : utils.printReceived(result.value);

type IndexedResult = [number, any];

// Return either empty string or one line per indexed result,
// so additional empty line can separate from `Number of returns` which follows.
const printReceivedResults = (
  utils: typeof MatcherUtils,
  label: string,
  expected: unknown,
  indexedResults: Array<IndexedResult>,
  isOnlyCall: boolean,
  iExpectedCall?: number,
) => {
  if (indexedResults.length === 0) {
    return '';
  }

  if (isOnlyCall && (iExpectedCall === 0 || iExpectedCall === undefined)) {
    return `${label + printResult(utils, indexedResults[0][1], expected)}\n`;
  }

  const printAligned = getRightAlignedPrinter(label);

  return (
    // eslint-disable-next-line prefer-template
    label.replace(':', '').trim() +
    '\n' +
    indexedResults.reduce(
      (printed: string, [i, result]: IndexedResult) =>
        `${
          printed +
          printAligned(String(i + 1), i === iExpectedCall) +
          printResult(utils, result, expected)
        }\n`,
      '',
    )
  );
};

const createToHaveBeenCalledMatcher = (): MatcherFunction<[unknown]> =>
  function (received: any, expected): SyncExpectationResult {
    const expectedArgument = '';
    const options: MatcherUtils.MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    this.utils.ensureNoExpected(expected, 'toHaveBeenCalled', options);
    ensureMockOrSpy(
      this.utils,
      received,
      'toHaveBeenCalled',
      expectedArgument,
      options,
    );

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
          // eslint-disable-next-line prefer-template
          this.utils.matcherHint(
            'toHaveBeenCalled',
            receivedName,
            expectedArgument,
            options,
          ) +
          '\n\n' +
          `Expected number of calls: ${this.utils.printExpected(0)}\n` +
          `Received number of calls: ${this.utils.printReceived(count)}\n\n` +
          calls
            .reduce((lines: Array<string>, args: any, i: number) => {
              if (lines.length < PRINT_LIMIT) {
                lines.push(`${i + 1}: ${printReceivedArgs(this.utils, args)}`);
              }

              return lines;
            }, [])
            .join('\n')
      : () =>
          // eslint-disable-next-line prefer-template
          this.utils.matcherHint(
            'toHaveBeenCalled',
            receivedName,
            expectedArgument,
            options,
          ) +
          '\n\n' +
          `Expected number of calls: >= ${this.utils.printExpected(1)}\n` +
          `Received number of calls:    ${this.utils.printReceived(count)}`;

    return {message, pass};
  };

const createToHaveReturnedMatcher = (): MatcherFunction<[unknown]> =>
  function (received: any, expected): SyncExpectationResult {
    const expectedArgument = '';
    const options: MatcherUtils.MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    this.utils.ensureNoExpected(expected, 'toHaveReturned', options);
    ensureMock(
      this.utils,
      received,
      'toHaveReturned',
      expectedArgument,
      options,
    );

    const receivedName = received.getMockName();

    // Count return values that correspond only to calls that returned
    const count = received.mock.results.reduce(
      (n: number, result: any) => (result.type === 'return' ? n + 1 : n),
      0,
    );

    const pass = count > 0;

    const message = pass
      ? () =>
          // eslint-disable-next-line prefer-template
          this.utils.matcherHint(
            'toHaveReturned',
            receivedName,
            expectedArgument,
            options,
          ) +
          '\n\n' +
          `Expected number of returns: ${this.utils.printExpected(0)}\n` +
          `Received number of returns: ${this.utils.printReceived(count)}\n\n` +
          received.mock.results
            .reduce((lines: Array<string>, result: any, i: number) => {
              if (result.type === 'return' && lines.length < PRINT_LIMIT) {
                lines.push(
                  `${i + 1}: ${this.utils.printReceived(result.value)}`,
                );
              }

              return lines;
            }, [])
            .join('\n') +
          (received.mock.calls.length === count
            ? ''
            : `\n\nReceived number of calls:   ${this.utils.printReceived(
                received.mock.calls.length,
              )}`)
      : () =>
          // eslint-disable-next-line prefer-template
          this.utils.matcherHint(
            'toHaveReturned',
            receivedName,
            expectedArgument,
            options,
          ) +
          '\n\n' +
          `Expected number of returns: >= ${this.utils.printExpected(1)}\n` +
          `Received number of returns:    ${this.utils.printReceived(count)}` +
          (received.mock.calls.length === count
            ? ''
            : `\nReceived number of calls:      ${this.utils.printReceived(
                received.mock.calls.length,
              )}`);

    return {message, pass};
  };

const createToHaveBeenCalledTimesMatcher = (): MatcherFunction<[number]> =>
  function (received: any, expected): SyncExpectationResult {
    const expectedArgument = 'expected';
    const options: MatcherUtils.MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    this.utils.ensureExpectedIsNonNegativeInteger(
      expected,
      'toHaveBeenCalledTimes',
      options,
    );
    ensureMockOrSpy(
      this.utils,
      received,
      'toHaveBeenCalledTimes',
      expectedArgument,
      options,
    );

    const receivedIsSpy = isSpy(received);
    const receivedName = receivedIsSpy ? 'spy' : received.getMockName();
    const count = receivedIsSpy
      ? received.calls.count()
      : received.mock.calls.length;

    const pass = count === expected;

    const message = pass
      ? () =>
          // eslint-disable-next-line prefer-template
          this.utils.matcherHint(
            'toHaveBeenCalledTimes',
            receivedName,
            expectedArgument,
            options,
          ) +
          '\n\n' +
          `Expected number of calls: not ${this.utils.printExpected(expected)}`
      : () =>
          // eslint-disable-next-line prefer-template
          this.utils.matcherHint(
            'toHaveBeenCalledTimes',
            receivedName,
            expectedArgument,
            options,
          ) +
          '\n\n' +
          `Expected number of calls: ${this.utils.printExpected(expected)}\n` +
          `Received number of calls: ${this.utils.printReceived(count)}`;

    return {message, pass};
  };

const createToHaveReturnedTimesMatcher = (): MatcherFunction<[number]> =>
  function (received: any, expected): SyncExpectationResult {
    const expectedArgument = 'expected';
    const options: MatcherUtils.MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    this.utils.ensureExpectedIsNonNegativeInteger(
      expected,
      'toHaveReturnedTimes',
      options,
    );
    ensureMock(
      this.utils,
      received,
      'toHaveReturnedTimes',
      expectedArgument,
      options,
    );

    const receivedName = received.getMockName();

    // Count return values that correspond only to calls that returned
    const count = received.mock.results.reduce(
      (n: number, result: any) => (result.type === 'return' ? n + 1 : n),
      0,
    );

    const pass = count === expected;

    const message = pass
      ? () =>
          // eslint-disable-next-line prefer-template
          this.utils.matcherHint(
            'toHaveReturnedTimes',
            receivedName,
            expectedArgument,
            options,
          ) +
          '\n\n' +
          `Expected number of returns: not ${this.utils.printExpected(
            expected,
          )}` +
          (received.mock.calls.length === count
            ? ''
            : `\n\nReceived number of calls:       ${this.utils.printReceived(
                received.mock.calls.length,
              )}`)
      : () =>
          // eslint-disable-next-line prefer-template
          this.utils.matcherHint(
            'toHaveReturnedTimes',
            receivedName,
            expectedArgument,
            options,
          ) +
          '\n\n' +
          `Expected number of returns: ${this.utils.printExpected(
            expected,
          )}\n` +
          `Received number of returns: ${this.utils.printReceived(count)}` +
          (received.mock.calls.length === count
            ? ''
            : `\nReceived number of calls:   ${this.utils.printReceived(
                received.mock.calls.length,
              )}`);

    return {message, pass};
  };

const createToHaveBeenCalledWithMatcher = (): MatcherFunction<Array<unknown>> =>
  function (received: any, ...expected): SyncExpectationResult {
    const expectedArgument = '...expected';
    const options: MatcherUtils.MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureMockOrSpy(
      this.utils,
      received,
      'toHaveBeenCalledWith',
      expectedArgument,
      options,
    );

    const receivedIsSpy = isSpy(received);
    const receivedName = receivedIsSpy ? 'spy' : received.getMockName();

    const calls = receivedIsSpy
      ? received.calls.all().map((x: any) => x.args)
      : received.mock.calls;

    const pass = calls.some((call: any) => isEqualCall(expected, call));

    const message = pass
      ? () => {
          // Some examples of calls that are equal to expected value.
          const indexedCalls: Array<IndexedCall> = [];
          let i = 0;
          while (i < calls.length && indexedCalls.length < PRINT_LIMIT) {
            if (isEqualCall(expected, calls[i])) {
              indexedCalls.push([i, calls[i]]);
            }
            i += 1;
          }

          return (
            // eslint-disable-next-line prefer-template
            this.utils.matcherHint(
              'toHaveBeenCalledWith',
              receivedName,
              expectedArgument,
              options,
            ) +
            '\n\n' +
            `Expected: not ${printExpectedArgs(this.utils, expected)}\n` +
            (calls.length === 1 &&
            this.utils.stringify(calls[0]) === this.utils.stringify(expected)
              ? ''
              : printReceivedCallsNegative(
                  this.utils,
                  expected,
                  indexedCalls,
                  calls.length === 1,
                )) +
            `\nNumber of calls: ${this.utils.printReceived(calls.length)}`
          );
        }
      : () => {
          // Some examples of calls that are not equal to expected value.
          const indexedCalls: Array<IndexedCall> = [];
          let i = 0;
          while (i < calls.length && indexedCalls.length < PRINT_LIMIT) {
            indexedCalls.push([i, calls[i]]);
            i += 1;
          }

          return (
            // eslint-disable-next-line prefer-template
            this.utils.matcherHint(
              'toHaveBeenCalledWith',
              receivedName,
              expectedArgument,
              options,
            ) +
            '\n\n' +
            printExpectedReceivedCallsPositive(
              this.utils,
              expected,
              indexedCalls,
              isExpand(this.expand),
              calls.length === 1,
            ) +
            `\nNumber of calls: ${this.utils.printReceived(calls.length)}`
          );
        };

    return {message, pass};
  };

const createToHaveReturnedWithMatcher = (): MatcherFunction<[unknown]> =>
  function (received: any, expected): SyncExpectationResult {
    const expectedArgument = 'expected';
    const options: MatcherUtils.MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureMock(
      this.utils,
      received,
      'toHaveReturnedWith',
      expectedArgument,
      options,
    );

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
            // eslint-disable-next-line prefer-template
            this.utils.matcherHint(
              'toHaveReturnedWith',
              receivedName,
              expectedArgument,
              options,
            ) +
            '\n\n' +
            `Expected: not ${this.utils.printExpected(expected)}\n` +
            (results.length === 1 &&
            results[0].type === 'return' &&
            this.utils.stringify(results[0].value) ===
              this.utils.stringify(expected)
              ? ''
              : printReceivedResults(
                  this.utils,
                  'Received:     ',
                  expected,
                  indexedResults,
                  results.length === 1,
                )) +
            printNumberOfReturns(
              this.utils,
              countReturns(results),
              calls.length,
            )
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
            // eslint-disable-next-line prefer-template
            this.utils.matcherHint(
              'toHaveReturnedWith',
              receivedName,
              expectedArgument,
              options,
            ) +
            '\n\n' +
            `Expected: ${this.utils.printExpected(expected)}\n` +
            printReceivedResults(
              this.utils,
              'Received: ',
              expected,
              indexedResults,
              results.length === 1,
            ) +
            printNumberOfReturns(
              this.utils,
              countReturns(results),
              calls.length,
            )
          );
        };

    return {message, pass};
  };

const createToHaveBeenLastCalledWithMatcher = (): MatcherFunction<
  Array<unknown>
> =>
  function (received: any, ...expected): SyncExpectationResult {
    const expectedArgument = '...expected';
    const options: MatcherUtils.MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureMockOrSpy(
      this.utils,
      received,
      'toHaveBeenLastCalledWith',
      expectedArgument,
      options,
    );

    const receivedIsSpy = isSpy(received);
    const receivedName = receivedIsSpy ? 'spy' : received.getMockName();

    const calls = receivedIsSpy
      ? received.calls.all().map((x: any) => x.args)
      : received.mock.calls;
    const iLast = calls.length - 1;

    const pass = iLast >= 0 && isEqualCall(expected, calls[iLast]);

    const message = pass
      ? () => {
          const indexedCalls: Array<IndexedCall> = [];
          if (iLast > 0) {
            // Display preceding call as context.
            indexedCalls.push([iLast - 1, calls[iLast - 1]]);
          }
          indexedCalls.push([iLast, calls[iLast]]);

          return (
            // eslint-disable-next-line prefer-template
            this.utils.matcherHint(
              'toHaveBeenLastCalledWith',
              receivedName,
              expectedArgument,
              options,
            ) +
            '\n\n' +
            `Expected: not ${printExpectedArgs(this.utils, expected)}\n` +
            (calls.length === 1 &&
            this.utils.stringify(calls[0]) === this.utils.stringify(expected)
              ? ''
              : printReceivedCallsNegative(
                  this.utils,
                  expected,
                  indexedCalls,
                  calls.length === 1,
                  iLast,
                )) +
            `\nNumber of calls: ${this.utils.printReceived(calls.length)}`
          );
        }
      : () => {
          const indexedCalls: Array<IndexedCall> = [];
          if (iLast >= 0) {
            if (iLast > 0) {
              let i = iLast - 1;
              // Is there a preceding call that is equal to expected args?
              while (i >= 0 && !isEqualCall(expected, calls[i])) {
                i -= 1;
              }
              if (i < 0) {
                i = iLast - 1; // otherwise, preceding call
              }

              indexedCalls.push([i, calls[i]]);
            }

            indexedCalls.push([iLast, calls[iLast]]);
          }

          return (
            // eslint-disable-next-line prefer-template
            this.utils.matcherHint(
              'toHaveBeenLastCalledWith',
              receivedName,
              expectedArgument,
              options,
            ) +
            '\n\n' +
            printExpectedReceivedCallsPositive(
              this.utils,
              expected,
              indexedCalls,
              isExpand(this.expand),
              calls.length === 1,
              iLast,
            ) +
            `\nNumber of calls: ${this.utils.printReceived(calls.length)}`
          );
        };

    return {message, pass};
  };

const createToHaveLastReturnedWithMatcher = (): MatcherFunction<[unknown]> =>
  function (received: any, expected): SyncExpectationResult {
    const expectedArgument = 'expected';
    const options: MatcherUtils.MatcherHintOptions = {
      isNot: this.isNot,
      promise: this.promise,
    };
    ensureMock(
      this.utils,
      received,
      'toHaveLastReturnedWith',
      expectedArgument,
      options,
    );

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
            // eslint-disable-next-line prefer-template
            this.utils.matcherHint(
              'toHaveLastReturnedWith',
              receivedName,
              expectedArgument,
              options,
            ) +
            '\n\n' +
            `Expected: not ${this.utils.printExpected(expected)}\n` +
            (results.length === 1 &&
            results[0].type === 'return' &&
            this.utils.stringify(results[0].value) ===
              this.utils.stringify(expected)
              ? ''
              : printReceivedResults(
                  this.utils,
                  'Received:     ',
                  expected,
                  indexedResults,
                  results.length === 1,
                  iLast,
                )) +
            printNumberOfReturns(
              this.utils,
              countReturns(results),
              calls.length,
            )
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
            // eslint-disable-next-line prefer-template
            this.utils.matcherHint(
              'toHaveLastReturnedWith',
              receivedName,
              expectedArgument,
              options,
            ) +
            '\n\n' +
            `Expected: ${this.utils.printExpected(expected)}\n` +
            printReceivedResults(
              this.utils,
              'Received: ',
              expected,
              indexedResults,
              results.length === 1,
              iLast,
            ) +
            printNumberOfReturns(
              this.utils,
              countReturns(results),
              calls.length,
            )
          );
        };

    return {message, pass};
  };

const createToHaveBeenNthCalledWithMatcher = (): MatcherFunction<
  [number, ...Array<unknown>]
> =>
  function (received: any, nth, ...expected): SyncExpectationResult {
    const expectedArgument = 'n';
    const options: MatcherUtils.MatcherHintOptions = {
      expectedColor: (arg: string) => arg,
      isNot: this.isNot,
      promise: this.promise,
      secondArgument: '...expected',
    };
    ensureMockOrSpy(
      this.utils,
      received,
      'toHaveBeenNthCalledWith',
      expectedArgument,
      options,
    );

    if (!Number.isSafeInteger(nth) || nth < 1) {
      throw new Error(
        this.utils.matcherErrorMessage(
          this.utils.matcherHint(
            'toHaveBeenNthCalledWith',
            undefined,
            expectedArgument,
            options,
          ),
          `${expectedArgument} must be a positive integer`,
          this.utils.printWithType(expectedArgument, nth, this.utils.stringify),
        ),
      );
    }

    const receivedIsSpy = isSpy(received);
    const receivedName = receivedIsSpy ? 'spy' : received.getMockName();

    const calls = receivedIsSpy
      ? received.calls.all().map((x: any) => x.args)
      : received.mock.calls;
    const length = calls.length;
    const iNth = nth - 1;

    const pass = iNth < length && isEqualCall(expected, calls[iNth]);

    const message = pass
      ? () => {
          // Display preceding and following calls,
          // in case assertions fails because index is off by one.
          const indexedCalls: Array<IndexedCall> = [];
          if (iNth - 1 >= 0) {
            indexedCalls.push([iNth - 1, calls[iNth - 1]]);
          }
          indexedCalls.push([iNth, calls[iNth]]);
          if (iNth + 1 < length) {
            indexedCalls.push([iNth + 1, calls[iNth + 1]]);
          }

          return (
            // eslint-disable-next-line prefer-template
            this.utils.matcherHint(
              'toHaveBeenNthCalledWith',
              receivedName,
              expectedArgument,
              options,
            ) +
            '\n\n' +
            `n: ${nth}\n` +
            `Expected: not ${printExpectedArgs(this.utils, expected)}\n` +
            (calls.length === 1 &&
            this.utils.stringify(calls[0]) === this.utils.stringify(expected)
              ? ''
              : printReceivedCallsNegative(
                  this.utils,
                  expected,
                  indexedCalls,
                  calls.length === 1,
                  iNth,
                )) +
            `\nNumber of calls: ${this.utils.printReceived(calls.length)}`
          );
        }
      : () => {
          // Display preceding and following calls:
          // * nearest call that is equal to expected args
          // * otherwise, adjacent call
          // in case assertions fails because of index, especially off by one.
          const indexedCalls: Array<IndexedCall> = [];
          if (iNth < length) {
            if (iNth - 1 >= 0) {
              let i = iNth - 1;
              // Is there a preceding call that is equal to expected args?
              while (i >= 0 && !isEqualCall(expected, calls[i])) {
                i -= 1;
              }
              if (i < 0) {
                i = iNth - 1; // otherwise, adjacent call
              }

              indexedCalls.push([i, calls[i]]);
            }
            indexedCalls.push([iNth, calls[iNth]]);
            if (iNth + 1 < length) {
              let i = iNth + 1;
              // Is there a following call that is equal to expected args?
              while (i < length && !isEqualCall(expected, calls[i])) {
                i += 1;
              }
              if (i >= length) {
                i = iNth + 1; // otherwise, adjacent call
              }

              indexedCalls.push([i, calls[i]]);
            }
          } else if (length > 0) {
            // The number of received calls is fewer than the expected number.
            let i = length - 1;
            // Is there a call that is equal to expected args?
            while (i >= 0 && !isEqualCall(expected, calls[i])) {
              i -= 1;
            }
            if (i < 0) {
              i = length - 1; // otherwise, last call
            }

            indexedCalls.push([i, calls[i]]);
          }

          return (
            // eslint-disable-next-line prefer-template
            this.utils.matcherHint(
              'toHaveBeenNthCalledWith',
              receivedName,
              expectedArgument,
              options,
            ) +
            '\n\n' +
            `n: ${nth}\n` +
            printExpectedReceivedCallsPositive(
              this.utils,
              expected,
              indexedCalls,
              isExpand(this.expand),
              calls.length === 1,
              iNth,
            ) +
            `\nNumber of calls: ${this.utils.printReceived(calls.length)}`
          );
        };

    return {message, pass};
  };

const createToHaveNthReturnedWithMatcher = (): MatcherFunction<
  [number, unknown]
> =>
  function (received: any, nth, expected): SyncExpectationResult {
    const expectedArgument = 'n';
    const options: MatcherUtils.MatcherHintOptions = {
      expectedColor: (arg: string) => arg,
      isNot: this.isNot,
      promise: this.promise,
      secondArgument: 'expected',
    };
    ensureMock(
      this.utils,
      received,
      'toHaveNthReturnedWith',
      expectedArgument,
      options,
    );
    if (!Number.isSafeInteger(nth) || nth < 1) {
      throw new Error(
        this.utils.matcherErrorMessage(
          this.utils.matcherHint(
            'toHaveNthReturnedWith',
            undefined,
            expectedArgument,
            options,
          ),
          `${expectedArgument} must be a positive integer`,
          this.utils.printWithType(expectedArgument, nth, this.utils.stringify),
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
            // eslint-disable-next-line prefer-template
            this.utils.matcherHint(
              'toHaveNthReturnedWith',
              receivedName,
              expectedArgument,
              options,
            ) +
            '\n\n' +
            `n: ${nth}\n` +
            `Expected: not ${this.utils.printExpected(expected)}\n` +
            (results.length === 1 &&
            results[0].type === 'return' &&
            this.utils.stringify(results[0].value) ===
              this.utils.stringify(expected)
              ? ''
              : printReceivedResults(
                  this.utils,
                  'Received:     ',
                  expected,
                  indexedResults,
                  results.length === 1,
                  iNth,
                )) +
            printNumberOfReturns(
              this.utils,
              countReturns(results),
              calls.length,
            )
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
            // eslint-disable-next-line prefer-template
            this.utils.matcherHint(
              'toHaveNthReturnedWith',
              receivedName,
              expectedArgument,
              options,
            ) +
            '\n\n' +
            `n: ${nth}\n` +
            `Expected: ${this.utils.printExpected(expected)}\n` +
            printReceivedResults(
              this.utils,
              'Received: ',
              expected,
              indexedResults,
              results.length === 1,
              iNth,
            ) +
            printNumberOfReturns(
              this.utils,
              countReturns(results),
              calls.length,
            )
          );
        };

    return {message, pass};
  };

const spyMatchers: MatchersObject = {
  toHaveBeenCalled: createToHaveBeenCalledMatcher(),
  toHaveBeenCalledTimes: createToHaveBeenCalledTimesMatcher(),
  toHaveBeenCalledWith: createToHaveBeenCalledWithMatcher(),
  toHaveBeenLastCalledWith: createToHaveBeenLastCalledWithMatcher(),
  toHaveBeenNthCalledWith: createToHaveBeenNthCalledWithMatcher(),
  toHaveLastReturnedWith: createToHaveLastReturnedWithMatcher(),
  toHaveNthReturnedWith: createToHaveNthReturnedWithMatcher(),
  toHaveReturned: createToHaveReturnedMatcher(),
  toHaveReturnedTimes: createToHaveReturnedTimesMatcher(),
  toHaveReturnedWith: createToHaveReturnedWithMatcher(),
};

const isMock = (received: any) =>
  received != null && received._isMockFunction === true;

const isSpy = (received: any) =>
  received != null &&
  received.calls != null &&
  typeof received.calls.all === 'function' &&
  typeof received.calls.count === 'function';

const ensureMockOrSpy = (
  utils: typeof MatcherUtils,
  received: any,
  matcherName: string,
  expectedArgument: string,
  options: MatcherUtils.MatcherHintOptions,
) => {
  if (!isMock(received) && !isSpy(received)) {
    throw new Error(
      utils.matcherErrorMessage(
        utils.matcherHint(matcherName, undefined, expectedArgument, options),
        `${utils.RECEIVED_COLOR(
          'received',
        )} value must be a mock or spy function`,
        utils.printWithType('Received', received, utils.printReceived),
      ),
    );
  }
};

const ensureMock = (
  utils: typeof MatcherUtils,
  received: any,
  matcherName: string,
  expectedArgument: string,
  options: MatcherUtils.MatcherHintOptions,
) => {
  if (!isMock(received)) {
    throw new Error(
      utils.matcherErrorMessage(
        utils.matcherHint(matcherName, undefined, expectedArgument, options),
        `${utils.RECEIVED_COLOR('received')} value must be a mock function`,
        utils.printWithType('Received', received, utils.printReceived),
      ),
    );
  }
};

export default spyMatchers;
