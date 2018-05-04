/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import chalk from 'chalk';
import getType from 'jest-get-type';
import prettyFormat from 'pretty-format';
const {
  AsymmetricMatcher,
  DOMCollection,
  DOMElement,
  Immutable,
  ReactElement,
  ReactTestComponent,
} = prettyFormat.plugins;

const PLUGINS = [
  ReactTestComponent,
  ReactElement,
  DOMElement,
  DOMCollection,
  Immutable,
  AsymmetricMatcher,
];

export const EXPECTED_COLOR = chalk.green;
export const RECEIVED_COLOR = chalk.red;

const NUMBERS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
];

export const SUGGEST_TO_EQUAL = chalk.dim(
  'Note that you are testing for equality with the stricter `toBe` matcher using `Object.is`. For deep equality only, use `toEqual` instead.',
);

export const SUGGEST_TO_CONTAIN_EQUAL = chalk.dim(
  'Looks like you wanted to test for object/array equality with the stricter `toContain` matcher. You probably need to use `toContainEqual` instead.',
);

export const stringify = (object: any, maxDepth?: number = 10): string => {
  const MAX_LENGTH = 10000;
  let result;

  try {
    result = prettyFormat(object, {
      maxDepth,
      min: true,
      plugins: PLUGINS,
    });
  } catch (e) {
    result = prettyFormat(object, {
      callToJSON: false,
      maxDepth,
      min: true,
      plugins: PLUGINS,
    });
  }

  return result.length >= MAX_LENGTH && maxDepth > 1
    ? stringify(object, Math.floor(maxDepth / 2))
    : result;
};

export const highlightTrailingWhitespace = (text: string): string =>
  text.replace(/\s+$/gm, chalk.inverse('$&'));

export const printReceived = (object: any) =>
  RECEIVED_COLOR(highlightTrailingWhitespace(stringify(object)));
export const printExpected = (value: any) =>
  EXPECTED_COLOR(highlightTrailingWhitespace(stringify(value)));

export const printWithType = (
  name: string,
  received: any,
  print: (value: any) => string,
) => {
  const type = getType(received);
  return (
    name +
    ':' +
    (type !== 'null' && type !== 'undefined' ? '\n  ' + type + ': ' : ' ') +
    print(received)
  );
};

export const ensureNoExpected = (expected: any, matcherName: string) => {
  matcherName || (matcherName = 'This');
  if (typeof expected !== 'undefined') {
    throw new Error(
      matcherHint('[.not]' + matcherName, undefined, '') +
        '\n\n' +
        'Matcher does not accept any arguments.\n' +
        printWithType('Got', expected, printExpected),
    );
  }
};

export const ensureActualIsNumber = (actual: any, matcherName: string) => {
  matcherName || (matcherName = 'This matcher');
  if (typeof actual !== 'number') {
    throw new Error(
      matcherHint('[.not]' + matcherName) +
        '\n\n' +
        `Received value must be a number.\n` +
        printWithType('Received', actual, printReceived),
    );
  }
};

export const ensureExpectedIsNumber = (expected: any, matcherName: string) => {
  matcherName || (matcherName = 'This matcher');
  if (typeof expected !== 'number') {
    throw new Error(
      matcherHint('[.not]' + matcherName) +
        '\n\n' +
        `Expected value must be a number.\n` +
        printWithType('Got', expected, printExpected),
    );
  }
};

export const ensureNumbers = (
  actual: any,
  expected: any,
  matcherName: string,
) => {
  ensureActualIsNumber(actual, matcherName);
  ensureExpectedIsNumber(expected, matcherName);
};

export const pluralize = (word: string, count: number) =>
  (NUMBERS[count] || count) + ' ' + word + (count === 1 ? '' : 's');

export const matcherHint = (
  matcherName: string,
  received: string = 'received',
  expected: string = 'expected',
  options: {
    comment?: string,
    isDirectExpectCall?: boolean,
    isNot?: boolean,
    secondArgument?: ?string,
  } = {},
) => {
  const {comment, isDirectExpectCall, isNot, secondArgument} = options;
  return (
    chalk.dim('expect' + (isDirectExpectCall ? '' : '(')) +
    RECEIVED_COLOR(received) +
    (isNot
      ? `${chalk.dim(').')}not${chalk.dim(matcherName + '(')}`
      : chalk.dim((isDirectExpectCall ? '' : ')') + matcherName + '(')) +
    EXPECTED_COLOR(expected) +
    (secondArgument
      ? `${chalk.dim(', ')}${EXPECTED_COLOR(secondArgument)}`
      : '') +
    chalk.dim(`)${comment ? ` // ${comment}` : ''}`)
  );
};
