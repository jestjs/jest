/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {isError} from '@jest/expect-utils';
import type * as MatcherUtils from 'jest-matcher-utils';
import {formatStackTrace, separateMessageFromStack} from 'jest-message-util';
import {
  printExpectedConstructorName,
  printExpectedConstructorNameNot,
  printReceivedConstructorName,
  printReceivedConstructorNameNot,
  printReceivedStringContainExpectedResult,
  printReceivedStringContainExpectedSubstring,
} from './print';
import type {
  ExpectationResult,
  MatcherFunction,
  MatchersObject,
  SyncExpectationResult,
} from './types';

const DID_NOT_THROW = 'Received function did not throw';

type Thrown =
  | {
      hasMessage: true;
      isError: true;
      message: string;
      value: Error;
    }
  | {
      hasMessage: boolean;
      isError: false;
      message: string;
      value: any;
    };

const getThrown = (e: any): Thrown => {
  const hasMessage =
    e !== null && e !== undefined && typeof e.message === 'string';

  if (hasMessage && typeof e.name === 'string' && typeof e.stack === 'string') {
    return {
      hasMessage,
      isError: true,
      message: e.message,
      value: e,
    };
  }

  return {
    hasMessage,
    isError: false,
    message: hasMessage ? e.message : String(e),
    value: e,
  };
};

export const createMatcher = (
  matcherName: string,
  fromPromise?: boolean,
): MatcherFunction<[any]> =>
  function (received, expected): ExpectationResult {
    const options = {
      isNot: this.isNot,
      promise: this.promise,
    };

    let thrown = null;

    if (fromPromise && isError(received)) {
      thrown = getThrown(received);
    } else {
      if (typeof received === 'function') {
        try {
          received();
        } catch (error) {
          thrown = getThrown(error);
        }
      } else {
        if (!fromPromise) {
          const placeholder = expected === undefined ? '' : 'expected';
          throw new Error(
            this.utils.matcherErrorMessage(
              this.utils.matcherHint(
                matcherName,
                undefined,
                placeholder,
                options,
              ),
              `${this.utils.RECEIVED_COLOR(
                'received',
              )} value must be a function`,
              this.utils.printWithType(
                'Received',
                received,
                this.utils.printReceived,
              ),
            ),
          );
        }
      }
    }

    if (expected === undefined) {
      return toThrow(this.utils, matcherName, options, thrown);
    } else if (typeof expected === 'function') {
      return toThrowExpectedClass(
        this.utils,
        matcherName,
        options,
        thrown,
        expected,
      );
    } else if (typeof expected === 'string') {
      return toThrowExpectedString(
        this.utils,
        matcherName,
        options,
        thrown,
        expected,
      );
    } else if (expected !== null && typeof expected.test === 'function') {
      return toThrowExpectedRegExp(
        this.utils,
        matcherName,
        options,
        thrown,
        expected,
      );
    } else if (
      expected !== null &&
      typeof expected.asymmetricMatch === 'function'
    ) {
      return toThrowExpectedAsymmetric(
        this.utils,
        matcherName,
        options,
        thrown,
        expected,
      );
    } else if (expected !== null && typeof expected === 'object') {
      return toThrowExpectedObject(
        this.utils,
        matcherName,
        options,
        thrown,
        expected,
      );
    } else {
      throw new Error(
        this.utils.matcherErrorMessage(
          this.utils.matcherHint(matcherName, undefined, undefined, options),
          `${this.utils.EXPECTED_COLOR(
            'expected',
          )} value must be a string or regular expression or class or error`,
          this.utils.printWithType(
            'Expected',
            expected,
            this.utils.printExpected,
          ),
        ),
      );
    }
  };

const matchers: MatchersObject = {
  toThrow: createMatcher('toThrow'),
};

const toThrowExpectedRegExp = (
  utils: typeof MatcherUtils,
  matcherName: string,
  options: MatcherUtils.MatcherHintOptions,
  thrown: Thrown | null,
  expected: RegExp,
): SyncExpectationResult => {
  const pass = thrown !== null && expected.test(thrown.message);

  const message = pass
    ? () =>
        // eslint-disable-next-line prefer-template
        utils.matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        formatExpected(utils, 'Expected pattern: not ', expected) +
        (thrown !== null && thrown.hasMessage
          ? formatReceived(
              utils,
              'Received message:     ',
              thrown,
              'message',
              expected,
            ) + formatStack(thrown)
          : formatReceived(utils, 'Received value:       ', thrown, 'value'))
    : () =>
        // eslint-disable-next-line prefer-template
        utils.matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        formatExpected(utils, 'Expected pattern: ', expected) +
        (thrown === null
          ? `\n${DID_NOT_THROW}`
          : thrown.hasMessage
            ? formatReceived(utils, 'Received message: ', thrown, 'message') +
              formatStack(thrown)
            : formatReceived(utils, 'Received value:   ', thrown, 'value'));

  return {message, pass};
};

type AsymmetricMatcher = {
  asymmetricMatch: (received: unknown) => boolean;
};

const toThrowExpectedAsymmetric = (
  utils: typeof MatcherUtils,
  matcherName: string,
  options: MatcherUtils.MatcherHintOptions,
  thrown: Thrown | null,
  expected: AsymmetricMatcher,
): SyncExpectationResult => {
  const pass = thrown !== null && expected.asymmetricMatch(thrown.value);

  const message = pass
    ? () =>
        // eslint-disable-next-line prefer-template
        utils.matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        formatExpected(utils, 'Expected asymmetric matcher: not ', expected) +
        '\n' +
        (thrown !== null && thrown.hasMessage
          ? formatReceived(utils, 'Received name:    ', thrown, 'name') +
            formatReceived(utils, 'Received message: ', thrown, 'message') +
            formatStack(thrown)
          : formatReceived(utils, 'Thrown value: ', thrown, 'value'))
    : () =>
        // eslint-disable-next-line prefer-template
        utils.matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        formatExpected(utils, 'Expected asymmetric matcher: ', expected) +
        '\n' +
        (thrown === null
          ? DID_NOT_THROW
          : thrown.hasMessage
            ? formatReceived(utils, 'Received name:    ', thrown, 'name') +
              formatReceived(utils, 'Received message: ', thrown, 'message') +
              formatStack(thrown)
            : formatReceived(utils, 'Thrown value: ', thrown, 'value'));

  return {message, pass};
};

const toThrowExpectedObject = (
  utils: typeof MatcherUtils,
  matcherName: string,
  options: MatcherUtils.MatcherHintOptions,
  thrown: Thrown | null,
  expected: Error,
): SyncExpectationResult => {
  const expectedMessageAndCause = createMessageAndCause(expected);
  const thrownMessageAndCause =
    thrown === null ? null : createMessageAndCause(thrown.value);
  const isCompareErrorInstance = thrown?.isError && expected instanceof Error;
  const isExpectedCustomErrorInstance =
    expected.constructor.name !== Error.name;

  const pass =
    thrown !== null &&
    thrown.message === expected.message &&
    thrownMessageAndCause === expectedMessageAndCause &&
    (!isCompareErrorInstance ||
      !isExpectedCustomErrorInstance ||
      thrown.value instanceof expected.constructor);

  const message = pass
    ? () =>
        // eslint-disable-next-line prefer-template
        utils.matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        formatExpected(
          utils,
          `Expected ${messageAndCause(expected)}: not `,
          expectedMessageAndCause,
        ) +
        (thrown !== null && thrown.hasMessage
          ? formatStack(thrown)
          : formatReceived(utils, 'Received value:       ', thrown, 'value'))
    : () =>
        // eslint-disable-next-line prefer-template
        utils.matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        (thrown === null
          ? // eslint-disable-next-line prefer-template
            formatExpected(
              utils,
              `Expected ${messageAndCause(expected)}: `,
              expectedMessageAndCause,
            ) +
            '\n' +
            DID_NOT_THROW
          : thrown.hasMessage
            ? // eslint-disable-next-line prefer-template
              utils.printDiffOrStringify(
                expectedMessageAndCause,
                thrownMessageAndCause,
                `Expected ${messageAndCause(expected)}`,
                `Received ${messageAndCause(thrown.value)}`,
                true,
              ) +
              '\n' +
              formatStack(thrown)
            : formatExpected(
                utils,
                `Expected ${messageAndCause(expected)}: `,
                expectedMessageAndCause,
              ) + formatReceived(utils, 'Received value:   ', thrown, 'value'));

  return {message, pass};
};

const toThrowExpectedClass = (
  utils: typeof MatcherUtils,
  matcherName: string,
  options: MatcherUtils.MatcherHintOptions,
  thrown: Thrown | null,
  expected: Function,
): SyncExpectationResult => {
  const pass = thrown !== null && thrown.value instanceof expected;

  const message = pass
    ? () =>
        // eslint-disable-next-line prefer-template
        utils.matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        printExpectedConstructorNameNot('Expected constructor', expected) +
        (thrown !== null &&
        thrown.value != null &&
        typeof thrown.value.constructor === 'function' &&
        thrown.value.constructor !== expected
          ? printReceivedConstructorNameNot(
              'Received constructor',
              thrown.value.constructor,
              expected,
            )
          : '') +
        '\n' +
        (thrown !== null && thrown.hasMessage
          ? formatReceived(utils, 'Received message: ', thrown, 'message') +
            formatStack(thrown)
          : formatReceived(utils, 'Received value: ', thrown, 'value'))
    : () =>
        // eslint-disable-next-line prefer-template
        utils.matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        printExpectedConstructorName('Expected constructor', expected) +
        (thrown === null
          ? `\n${DID_NOT_THROW}`
          : `${
              thrown.value != null &&
              typeof thrown.value.constructor === 'function'
                ? printReceivedConstructorName(
                    'Received constructor',
                    thrown.value.constructor,
                  )
                : ''
            }\n${
              thrown.hasMessage
                ? formatReceived(
                    utils,
                    'Received message: ',
                    thrown,
                    'message',
                  ) + formatStack(thrown)
                : formatReceived(utils, 'Received value: ', thrown, 'value')
            }`);

  return {message, pass};
};

const toThrowExpectedString = (
  utils: typeof MatcherUtils,
  matcherName: string,
  options: MatcherUtils.MatcherHintOptions,
  thrown: Thrown | null,
  expected: string,
): SyncExpectationResult => {
  const pass = thrown !== null && thrown.message.includes(expected);

  const message = pass
    ? () =>
        // eslint-disable-next-line prefer-template
        utils.matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        formatExpected(utils, 'Expected substring: not ', expected) +
        (thrown !== null && thrown.hasMessage
          ? formatReceived(
              utils,
              'Received message:       ',
              thrown,
              'message',
              expected,
            ) + formatStack(thrown)
          : formatReceived(utils, 'Received value:         ', thrown, 'value'))
    : () =>
        // eslint-disable-next-line prefer-template
        utils.matcherHint(matcherName, undefined, undefined, options) +
        '\n\n' +
        formatExpected(utils, 'Expected substring: ', expected) +
        (thrown === null
          ? `\n${DID_NOT_THROW}`
          : thrown.hasMessage
            ? formatReceived(utils, 'Received message:   ', thrown, 'message') +
              formatStack(thrown)
            : formatReceived(utils, 'Received value:     ', thrown, 'value'));

  return {message, pass};
};

const toThrow = (
  utils: typeof MatcherUtils,
  matcherName: string,
  options: MatcherUtils.MatcherHintOptions,
  thrown: Thrown | null,
): SyncExpectationResult => {
  const pass = thrown !== null;

  const message = pass
    ? () =>
        // eslint-disable-next-line prefer-template
        utils.matcherHint(matcherName, undefined, '', options) +
        '\n\n' +
        (thrown !== null && thrown.hasMessage
          ? formatReceived(utils, 'Error name:    ', thrown, 'name') +
            formatReceived(utils, 'Error message: ', thrown, 'message') +
            formatStack(thrown)
          : formatReceived(utils, 'Thrown value: ', thrown, 'value'))
    : () =>
        // eslint-disable-next-line prefer-template
        utils.matcherHint(matcherName, undefined, '', options) +
        '\n\n' +
        DID_NOT_THROW;

  return {message, pass};
};

const formatExpected = (
  utils: typeof MatcherUtils,
  label: string,
  expected: unknown,
) => `${label + utils.printExpected(expected)}\n`;

const formatReceived = (
  utils: typeof MatcherUtils,
  label: string,
  thrown: Thrown | null,
  key: string,
  expected?: string | RegExp,
) => {
  if (thrown === null) {
    return '';
  }

  if (key === 'message') {
    const message = thrown.message;

    if (typeof expected === 'string') {
      const index = message.indexOf(expected);
      if (index !== -1) {
        return `${
          label +
          printReceivedStringContainExpectedSubstring(
            message,
            index,
            expected.length,
          )
        }\n`;
      }
    } else if (expected instanceof RegExp) {
      return `${
        label +
        printReceivedStringContainExpectedResult(
          message,
          typeof expected.exec === 'function' ? expected.exec(message) : null,
        )
      }\n`;
    }

    return `${label + utils.printReceived(message)}\n`;
  }

  if (key === 'name') {
    return thrown.isError
      ? `${label + utils.printReceived(thrown.value.name)}\n`
      : '';
  }

  if (key === 'value') {
    return thrown.isError
      ? ''
      : `${label + utils.printReceived(thrown.value)}\n`;
  }

  return '';
};

const formatStack = (thrown: Thrown | null) => {
  if (thrown === null || !thrown.isError) {
    return '';
  } else {
    const config = {
      rootDir: process.cwd(),
      testMatch: [],
    };
    const options = {
      noStackTrace: false,
    };
    if (thrown.value instanceof AggregateError) {
      return formatExecError(thrown.value, config, options);
    } else {
      return formatStackTrace(
        separateMessageFromStack(thrown.value.stack!).stack,
        config,
        options,
      );
    }
  }
};

function createMessageAndCause(error: Error) {
  if (error.cause) {
    const seen = new WeakSet();
    return JSON.stringify(buildSerializeError(error), (_, value) => {
      if (isObject(value)) {
        if (seen.has(value)) return;
        seen.add(value); // stop circular references
      }
      return value === undefined ? String(undefined) : value;
    });
  }

  return error.message;
}

function buildSerializeError(error: {[key: string]: any}) {
  if (!isObject(error)) {
    return error;
  }

  const result: {[key: string]: any} = {};
  for (const name of Object.getOwnPropertyNames(error).sort()) {
    if (['stack', 'fileName', 'lineNumber'].includes(name)) {
      continue;
    }
    if (name === 'cause') {
      result[name] = buildSerializeError(error['cause']);
      continue;
    }
    result[name] = error[name];
  }

  return result;
}

function isObject(obj: unknown) {
  return obj != null && typeof obj === 'object';
}

function messageAndCause(error: Error) {
  return error.cause === undefined ? 'message' : 'message and cause';
}

export default matchers;
