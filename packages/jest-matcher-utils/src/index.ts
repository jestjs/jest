/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable local/ban-types-eventually */

import chalk = require('chalk');
import {
  DIFF_DELETE,
  DIFF_EQUAL,
  DIFF_INSERT,
  Diff,
  DiffOptions as ImportDiffOptions,
  diff as diffDefault,
  diffStringsRaw,
  diffStringsUnified,
} from 'jest-diff';
import {getType, isPrimitive} from 'jest-get-type';
import {
  format as prettyFormat,
  plugins as prettyFormatPlugins,
} from 'pretty-format';
import Replaceable from './Replaceable';
import deepCyclicCopyReplaceable from './deepCyclicCopyReplaceable';

const {
  AsymmetricMatcher,
  DOMCollection,
  DOMElement,
  Immutable,
  ReactElement,
  ReactTestComponent,
} = prettyFormatPlugins;

const PLUGINS = [
  ReactTestComponent,
  ReactElement,
  DOMElement,
  DOMCollection,
  Immutable,
  AsymmetricMatcher,
];

type MatcherHintColor = (arg: string) => string; // subset of Chalk type

export type MatcherHintOptions = {
  comment?: string;
  expectedColor?: MatcherHintColor;
  isDirectExpectCall?: boolean;
  isNot?: boolean;
  promise?: string;
  receivedColor?: MatcherHintColor;
  secondArgument?: string;
  secondArgumentColor?: MatcherHintColor;
};

export type DiffOptions = ImportDiffOptions;

export const EXPECTED_COLOR = chalk.green;
export const RECEIVED_COLOR = chalk.red;
export const INVERTED_COLOR = chalk.inverse;
export const BOLD_WEIGHT = chalk.bold;
export const DIM_COLOR = chalk.dim;

const MULTILINE_REGEXP = /\n/;
const SPACE_SYMBOL = '\u{00B7}'; // middle dot

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

export const SUGGEST_TO_CONTAIN_EQUAL = chalk.dim(
  'Looks like you wanted to test for object/array equality with the stricter `toContain` matcher. You probably need to use `toContainEqual` instead.',
);

export const stringify = (
  object: unknown,
  maxDepth = 10,
  maxWidth = 10,
): string => {
  const MAX_LENGTH = 10000;
  let result;

  try {
    result = prettyFormat(object, {
      maxDepth,
      maxWidth,
      min: true,
      plugins: PLUGINS,
    });
  } catch {
    result = prettyFormat(object, {
      callToJSON: false,
      maxDepth,
      maxWidth,
      min: true,
      plugins: PLUGINS,
    });
  }

  if (result.length >= MAX_LENGTH && maxDepth > 1) {
    return stringify(object, Math.floor(maxDepth / 2), maxWidth);
  } else if (result.length >= MAX_LENGTH && maxWidth > 1) {
    return stringify(object, maxDepth, Math.floor(maxWidth / 2));
  } else {
    return result;
  }
};

export const highlightTrailingWhitespace = (text: string): string =>
  text.replace(/\s+$/gm, chalk.inverse('$&'));

// Instead of inverse highlight which now implies a change,
// replace common spaces with middle dot at the end of any line.
const replaceTrailingSpaces = (text: string): string =>
  text.replace(/\s+$/gm, spaces => SPACE_SYMBOL.repeat(spaces.length));

export const printReceived = (object: unknown): string =>
  RECEIVED_COLOR(replaceTrailingSpaces(stringify(object)));
export const printExpected = (value: unknown): string =>
  EXPECTED_COLOR(replaceTrailingSpaces(stringify(value)));

export function printWithType<T>(
  name: string,
  value: T,
  print: (value: T) => string,
): string {
  const type = getType(value);
  const hasType =
    type !== 'null' && type !== 'undefined'
      ? `${name} has type:  ${type}\n`
      : '';
  const hasValue = `${name} has value: ${print(value)}`;
  return hasType + hasValue;
}

export const ensureNoExpected = (
  expected: unknown,
  matcherName: string,
  options?: MatcherHintOptions,
): void => {
  if (typeof expected !== 'undefined') {
    // Prepend maybe not only for backward compatibility.
    const matcherString = (options ? '' : '[.not]') + matcherName;
    throw new Error(
      matcherErrorMessage(
        matcherHint(matcherString, undefined, '', options),
        // Because expected is omitted in hint above,
        // expected is black instead of green in message below.
        'this matcher must not have an expected argument',
        printWithType('Expected', expected, printExpected),
      ),
    );
  }
};

/**
 * Ensures that `actual` is of type `number | bigint`
 */
export const ensureActualIsNumber = (
  actual: unknown,
  matcherName: string,
  options?: MatcherHintOptions,
): void => {
  if (typeof actual !== 'number' && typeof actual !== 'bigint') {
    // Prepend maybe not only for backward compatibility.
    const matcherString = (options ? '' : '[.not]') + matcherName;
    throw new Error(
      matcherErrorMessage(
        matcherHint(matcherString, undefined, undefined, options),
        `${RECEIVED_COLOR('received')} value must be a number or bigint`,
        printWithType('Received', actual, printReceived),
      ),
    );
  }
};

/**
 * Ensures that `expected` is of type `number | bigint`
 */
export const ensureExpectedIsNumber = (
  expected: unknown,
  matcherName: string,
  options?: MatcherHintOptions,
): void => {
  if (typeof expected !== 'number' && typeof expected !== 'bigint') {
    // Prepend maybe not only for backward compatibility.
    const matcherString = (options ? '' : '[.not]') + matcherName;
    throw new Error(
      matcherErrorMessage(
        matcherHint(matcherString, undefined, undefined, options),
        `${EXPECTED_COLOR('expected')} value must be a number or bigint`,
        printWithType('Expected', expected, printExpected),
      ),
    );
  }
};

/**
 * Ensures that `actual` & `expected` are of type `number | bigint`
 */
export const ensureNumbers = (
  actual: unknown,
  expected: unknown,
  matcherName: string,
  options?: MatcherHintOptions,
): void => {
  ensureActualIsNumber(actual, matcherName, options);
  ensureExpectedIsNumber(expected, matcherName, options);
};

export const ensureExpectedIsNonNegativeInteger = (
  expected: unknown,
  matcherName: string,
  options?: MatcherHintOptions,
): void => {
  if (
    typeof expected !== 'number' ||
    !Number.isSafeInteger(expected) ||
    expected < 0
  ) {
    // Prepend maybe not only for backward compatibility.
    const matcherString = (options ? '' : '[.not]') + matcherName;
    throw new Error(
      matcherErrorMessage(
        matcherHint(matcherString, undefined, undefined, options),
        `${EXPECTED_COLOR('expected')} value must be a non-negative integer`,
        printWithType('Expected', expected, printExpected),
      ),
    );
  }
};

// Given array of diffs, return concatenated string:
// * include common substrings
// * exclude change substrings which have opposite op
// * include change substrings which have argument op
//   with inverse highlight only if there is a common substring
const getCommonAndChangedSubstrings = (
  diffs: Array<Diff>,
  op: number,
  hasCommonDiff: boolean,
): string =>
  diffs.reduce(
    (reduced: string, diff: Diff): string =>
      reduced +
      (diff[0] === DIFF_EQUAL
        ? diff[1]
        : diff[0] !== op
        ? ''
        : hasCommonDiff
        ? INVERTED_COLOR(diff[1])
        : diff[1]),
    '',
  );

const isLineDiffable = (expected: unknown, received: unknown): boolean => {
  const expectedType = getType(expected);
  const receivedType = getType(received);

  if (expectedType !== receivedType) {
    return false;
  }

  if (isPrimitive(expected)) {
    // Print generic line diff for strings only:
    // * if neither string is empty
    // * if either string has more than one line
    return (
      typeof expected === 'string' &&
      typeof received === 'string' &&
      expected.length !== 0 &&
      received.length !== 0 &&
      (MULTILINE_REGEXP.test(expected) || MULTILINE_REGEXP.test(received))
    );
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
    receivedType === 'object' &&
    typeof (received as any).asymmetricMatch === 'function'
  ) {
    return false;
  }

  return true;
};

const MAX_DIFF_STRING_LENGTH = 20000;

export const printDiffOrStringify = (
  expected: unknown,
  received: unknown,
  expectedLabel: string,
  receivedLabel: string,
  expand: boolean, // CLI options: true if `--expand` or false if `--no-expand`
): string => {
  if (
    typeof expected === 'string' &&
    typeof received === 'string' &&
    expected.length !== 0 &&
    received.length !== 0 &&
    expected.length <= MAX_DIFF_STRING_LENGTH &&
    received.length <= MAX_DIFF_STRING_LENGTH &&
    expected !== received
  ) {
    if (expected.includes('\n') || received.includes('\n')) {
      return diffStringsUnified(expected, received, {
        aAnnotation: expectedLabel,
        bAnnotation: receivedLabel,
        changeLineTrailingSpaceColor: chalk.bgYellow,
        commonLineTrailingSpaceColor: chalk.bgYellow,
        emptyFirstOrLastLinePlaceholder: '↵', // U+21B5
        expand,
        includeChangeCounts: true,
      });
    }

    const diffs = diffStringsRaw(expected, received, true);
    const hasCommonDiff = diffs.some(diff => diff[0] === DIFF_EQUAL);

    const printLabel = getLabelPrinter(expectedLabel, receivedLabel);
    const expectedLine =
      printLabel(expectedLabel) +
      printExpected(
        getCommonAndChangedSubstrings(diffs, DIFF_DELETE, hasCommonDiff),
      );
    const receivedLine =
      printLabel(receivedLabel) +
      printReceived(
        getCommonAndChangedSubstrings(diffs, DIFF_INSERT, hasCommonDiff),
      );

    return `${expectedLine}\n${receivedLine}`;
  }

  if (isLineDiffable(expected, received)) {
    const {replacedExpected, replacedReceived} =
      replaceMatchedToAsymmetricMatcher(expected, received, [], []);
    const difference = diffDefault(replacedExpected, replacedReceived, {
      aAnnotation: expectedLabel,
      bAnnotation: receivedLabel,
      expand,
      includeChangeCounts: true,
    });

    if (
      typeof difference === 'string' &&
      difference.includes(`- ${expectedLabel}`) &&
      difference.includes(`+ ${receivedLabel}`)
    ) {
      return difference;
    }
  }

  const printLabel = getLabelPrinter(expectedLabel, receivedLabel);
  const expectedLine = printLabel(expectedLabel) + printExpected(expected);
  const receivedLine =
    printLabel(receivedLabel) +
    (stringify(expected) === stringify(received)
      ? 'serializes to the same string'
      : printReceived(received));

  return `${expectedLine}\n${receivedLine}`;
};

// Sometimes, e.g. when comparing two numbers, the output from jest-diff
// does not contain more information than the `Expected:` / `Received:` already gives.
// In those cases, we do not print a diff to make the output shorter and not redundant.
const shouldPrintDiff = (actual: unknown, expected: unknown) => {
  if (typeof actual === 'number' && typeof expected === 'number') {
    return false;
  }
  if (typeof actual === 'bigint' && typeof expected === 'bigint') {
    return false;
  }
  if (typeof actual === 'boolean' && typeof expected === 'boolean') {
    return false;
  }
  return true;
};

export function replaceMatchedToAsymmetricMatcher(
  replacedExpected: unknown,
  replacedReceived: unknown,
  expectedCycles: Array<unknown>,
  receivedCycles: Array<unknown>,
): {replacedExpected: unknown; replacedReceived: unknown} {
  return _replaceMatchedToAsymmetricMatcher(
    deepCyclicCopyReplaceable(replacedExpected),
    deepCyclicCopyReplaceable(replacedReceived),
    expectedCycles,
    receivedCycles,
  );
}

function _replaceMatchedToAsymmetricMatcher(
  replacedExpected: unknown,
  replacedReceived: unknown,
  expectedCycles: Array<unknown>,
  receivedCycles: Array<unknown>,
) {
  if (!Replaceable.isReplaceable(replacedExpected, replacedReceived)) {
    return {replacedExpected, replacedReceived};
  }

  if (
    expectedCycles.includes(replacedExpected) ||
    receivedCycles.includes(replacedReceived)
  ) {
    return {replacedExpected, replacedReceived};
  }

  expectedCycles.push(replacedExpected);
  receivedCycles.push(replacedReceived);

  const expectedReplaceable = new Replaceable(replacedExpected);
  const receivedReplaceable = new Replaceable(replacedReceived);

  expectedReplaceable.forEach((expectedValue: unknown, key: unknown) => {
    const receivedValue = receivedReplaceable.get(key);
    if (isAsymmetricMatcher(expectedValue)) {
      if (expectedValue.asymmetricMatch(receivedValue)) {
        receivedReplaceable.set(key, expectedValue);
      }
    } else if (isAsymmetricMatcher(receivedValue)) {
      if (receivedValue.asymmetricMatch(expectedValue)) {
        expectedReplaceable.set(key, receivedValue);
      }
    } else if (Replaceable.isReplaceable(expectedValue, receivedValue)) {
      const replaced = _replaceMatchedToAsymmetricMatcher(
        expectedValue,
        receivedValue,
        expectedCycles,
        receivedCycles,
      );
      expectedReplaceable.set(key, replaced.replacedExpected);
      receivedReplaceable.set(key, replaced.replacedReceived);
    }
  });

  return {
    replacedExpected: expectedReplaceable.object,
    replacedReceived: receivedReplaceable.object,
  };
}

type AsymmetricMatcher = {
  asymmetricMatch: Function;
};

function isAsymmetricMatcher(data: any): data is AsymmetricMatcher {
  const type = getType(data);
  return type === 'object' && typeof data.asymmetricMatch === 'function';
}

export const diff = (
  a: unknown,
  b: unknown,
  options?: DiffOptions,
): string | null => (shouldPrintDiff(a, b) ? diffDefault(a, b, options) : null);

export const pluralize = (word: string, count: number): string =>
  `${NUMBERS[count] || count} ${word}${count === 1 ? '' : 's'}`;

// To display lines of labeled values as two columns with monospace alignment:
// given the strings which will describe the values,
// return function which given each string, returns the label:
// string, colon, space, and enough padding spaces to align the value.

type PrintLabel = (string: string) => string;

export const getLabelPrinter = (...strings: Array<string>): PrintLabel => {
  const maxLength = strings.reduce(
    (max, string) => (string.length > max ? string.length : max),
    0,
  );
  return (string: string): string =>
    `${string}: ${' '.repeat(maxLength - string.length)}`;
};

export const matcherErrorMessage = (
  hint: string, // assertion returned from call to matcherHint
  generic: string, // condition which correct value must fulfill
  specific?: string, // incorrect value returned from call to printWithType
): string =>
  `${hint}\n\n${chalk.bold('Matcher error')}: ${generic}${
    typeof specific === 'string' ? `\n\n${specific}` : ''
  }`;

// Display assertion for the report when a test fails.
// New format: rejects/resolves, not, and matcher name have black color
// Old format: matcher name has dim color
export const matcherHint = (
  matcherName: string,
  received = 'received',
  expected = 'expected',
  options: MatcherHintOptions = {},
): string => {
  const {
    comment = '',
    expectedColor = EXPECTED_COLOR,
    isDirectExpectCall = false, // seems redundant with received === ''
    isNot = false,
    promise = '',
    receivedColor = RECEIVED_COLOR,
    secondArgument = '',
    secondArgumentColor = EXPECTED_COLOR,
  } = options;
  let hint = '';
  let dimString = 'expect'; // concatenate adjacent dim substrings

  if (!isDirectExpectCall && received !== '') {
    hint += DIM_COLOR(`${dimString}(`) + receivedColor(received);
    dimString = ')';
  }

  if (promise !== '') {
    hint += DIM_COLOR(`${dimString}.`) + promise;
    dimString = '';
  }

  if (isNot) {
    hint += `${DIM_COLOR(`${dimString}.`)}not`;
    dimString = '';
  }

  if (matcherName.includes('.')) {
    // Old format: for backward compatibility,
    // especially without promise or isNot options
    dimString += matcherName;
  } else {
    // New format: omit period from matcherName arg
    hint += DIM_COLOR(`${dimString}.`) + matcherName;
    dimString = '';
  }

  if (expected === '') {
    dimString += '()';
  } else {
    hint += DIM_COLOR(`${dimString}(`) + expectedColor(expected);
    if (secondArgument) {
      hint += DIM_COLOR(', ') + secondArgumentColor(secondArgument);
    }
    dimString = ')';
  }

  if (comment !== '') {
    dimString += ` // ${comment}`;
  }

  if (dimString !== '') {
    hint += DIM_COLOR(dimString);
  }

  return hint;
};
