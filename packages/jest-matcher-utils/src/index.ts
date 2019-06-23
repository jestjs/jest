/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from 'chalk';
import jestDiff, {DiffOptions, getStringDiff} from 'jest-diff';
import getType, {isPrimitive} from 'jest-get-type';
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

export type MatcherHintOptions = {
  comment?: string;
  isDirectExpectCall?: boolean;
  isNot?: boolean;
  promise?: string;
  secondArgument?: string;
};

export {DiffOptions};

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

export const stringify = (object: unknown, maxDepth: number = 10): string => {
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

// Instead of inverse highlight which now implies a change,
// replace common spaces with middle dot at the end of any line.
const replaceTrailingSpaces = (text: string): string =>
  text.replace(/\s+$/gm, spaces => SPACE_SYMBOL.repeat(spaces.length));

export const printReceived = (object: unknown) =>
  RECEIVED_COLOR(replaceTrailingSpaces(stringify(object)));
export const printExpected = (value: unknown) =>
  EXPECTED_COLOR(replaceTrailingSpaces(stringify(value)));

export const printWithType = (
  name: string, // 'Expected' or 'Received'
  value: unknown,
  print: (value: unknown) => string, // printExpected or printReceived
) => {
  const type = getType(value);
  const hasType =
    type !== 'null' && type !== 'undefined'
      ? `${name} has type:  ${type}\n`
      : '';
  const hasValue = `${name} has value: ${print(value)}`;
  return hasType + hasValue;
};

export const ensureNoExpected = (
  expected: unknown,
  matcherName: string,
  options?: MatcherHintOptions,
) => {
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

export const ensureActualIsNumber = (
  actual: unknown,
  matcherName: string,
  options?: MatcherHintOptions,
) => {
  if (typeof actual !== 'number') {
    // Prepend maybe not only for backward compatibility.
    const matcherString = (options ? '' : '[.not]') + matcherName;
    throw new Error(
      matcherErrorMessage(
        matcherHint(matcherString, undefined, undefined, options),
        `${RECEIVED_COLOR('received')} value must be a number`,
        printWithType('Received', actual, printReceived),
      ),
    );
  }
};

export const ensureExpectedIsNumber = (
  expected: unknown,
  matcherName: string,
  options?: MatcherHintOptions,
) => {
  if (typeof expected !== 'number') {
    // Prepend maybe not only for backward compatibility.
    const matcherString = (options ? '' : '[.not]') + matcherName;
    throw new Error(
      matcherErrorMessage(
        matcherHint(matcherString, undefined, undefined, options),
        `${EXPECTED_COLOR('expected')} value must be a number`,
        printWithType('Expected', expected, printExpected),
      ),
    );
  }
};

export const ensureNumbers = (
  actual: unknown,
  expected: unknown,
  matcherName: string,
  options?: MatcherHintOptions,
) => {
  ensureActualIsNumber(actual, matcherName, options);
  ensureExpectedIsNumber(expected, matcherName, options);
};

export const ensureExpectedIsNonNegativeInteger = (
  expected: unknown,
  matcherName: string,
  options?: MatcherHintOptions,
) => {
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

export const printDiffOrStringify = (
  expected: unknown,
  received: unknown,
  expectedLabel: string,
  receivedLabel: string,
  expand: boolean, // CLI options: true if `--expand` or false if `--no-expand`
): string => {
  if (typeof expected === 'string' && typeof received === 'string') {
    const result = getStringDiff(expected, received, {
      aAnnotation: expectedLabel,
      bAnnotation: receivedLabel,
      expand,
    });

    if (result !== null) {
      if (result.isMultiline) {
        return result.annotatedDiff;
      }

      const printLabel = getLabelPrinter(expectedLabel, receivedLabel);
      const expectedLine = printLabel(expectedLabel) + printExpected(result.a);
      const receivedLine = printLabel(receivedLabel) + printReceived(result.b);

      return expectedLine + '\n' + receivedLine;
    }
  }

  if (isLineDiffable(expected, received)) {
    const difference = jestDiff(expected, received, {
      aAnnotation: expectedLabel,
      bAnnotation: receivedLabel,
      expand,
    });

    if (
      typeof difference === 'string' &&
      difference.includes('- ' + expectedLabel) &&
      difference.includes('+ ' + receivedLabel)
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

  return expectedLine + '\n' + receivedLine;
};

// Sometimes, e.g. when comparing two numbers, the output from jest-diff
// does not contain more information than the `Expected:` / `Received:` already gives.
// In those cases, we do not print a diff to make the output shorter and not redundant.
const shouldPrintDiff = (actual: unknown, expected: unknown) => {
  if (typeof actual === 'number' && typeof expected === 'number') {
    return false;
  }
  if (typeof actual === 'boolean' && typeof expected === 'boolean') {
    return false;
  }
  return true;
};

export const diff = (a: any, b: any, options?: DiffOptions): string | null =>
  shouldPrintDiff(a, b) ? jestDiff(a, b, options) : null;

export const pluralize = (word: string, count: number) =>
  (NUMBERS[count] || count) + ' ' + word + (count === 1 ? '' : 's');

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
  return string => `${string}: ${' '.repeat(maxLength - string.length)}`;
};

export const matcherErrorMessage = (
  hint: string, // assertion returned from call to matcherHint
  generic: string, // condition which correct value must fulfill
  specific: string, // incorrect value returned from call to printWithType
) => `${hint}\n\n${chalk.bold('Matcher error')}: ${generic}\n\n${specific}`;

// Display assertion for the report when a test fails.
// New format: rejects/resolves, not, and matcher name have black color
// Old format: matcher name has dim color
export const matcherHint = (
  matcherName: string,
  received: string = 'received',
  expected: string = 'expected',
  options: MatcherHintOptions = {},
) => {
  const {
    comment = '',
    isDirectExpectCall = false, // seems redundant with received === ''
    isNot = false,
    promise = '',
    secondArgument = '',
  } = options;
  let hint = '';
  let dimString = 'expect'; // concatenate adjacent dim substrings

  if (!isDirectExpectCall && received !== '') {
    hint += DIM_COLOR(dimString + '(') + RECEIVED_COLOR(received);
    dimString = ')';
  }

  if (promise !== '') {
    hint += DIM_COLOR(dimString + '.') + promise;
    dimString = '';
  }

  if (isNot) {
    hint += DIM_COLOR(dimString + '.') + 'not';
    dimString = '';
  }

  if (matcherName.includes('.')) {
    // Old format: for backward compatibility,
    // especially without promise or isNot options
    dimString += matcherName;
  } else {
    // New format: omit period from matcherName arg
    hint += DIM_COLOR(dimString + '.') + matcherName;
    dimString = '';
  }

  if (expected === '') {
    dimString += '()';
  } else {
    hint += DIM_COLOR(dimString + '(') + EXPECTED_COLOR(expected);
    if (secondArgument) {
      hint += DIM_COLOR(', ') + EXPECTED_COLOR(secondArgument);
    }
    dimString = ')';
  }

  if (comment !== '') {
    dimString += ' // ' + comment;
  }

  if (dimString !== '') {
    hint += DIM_COLOR(dimString);
  }

  return hint;
};
