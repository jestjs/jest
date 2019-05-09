/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import getType, {isPrimitive} from 'jest-get-type';
import {
  EXPECTED_COLOR,
  INVERTED_COLOR,
  RECEIVED_COLOR,
  diff,
  getLabelPrinter,
  printExpected,
  printReceived,
  stringify,
} from 'jest-matcher-utils';
import diffSequences from 'diff-sequences';
import {
  cleanupSemantic,
  Diff,
  DIFF_COMMON,
  DIFF_DELETE,
  DIFF_INSERT,
} from './cleanupSemantic.js';
import {isOneline} from './utils';

// Format substring but do not enclose in double quote marks.
// The replacement is compatible with pretty-format package.
const printSubstring = (val: string): string => val.replace(/"|\\/g, '\\$&');

export const printReceivedStringContainExpectedSubstring = (
  received: string,
  start: number,
  length: number, // not end
): string =>
  RECEIVED_COLOR(
    '"' +
      printSubstring(received.slice(0, start)) +
      INVERTED_COLOR(printSubstring(received.slice(start, start + length))) +
      printSubstring(received.slice(start + length)) +
      '"',
  );

export const printReceivedStringContainExpectedResult = (
  received: string,
  result: RegExpExecArray | null,
): string =>
  result === null
    ? printReceived(received)
    : printReceivedStringContainExpectedSubstring(
        received,
        result.index,
        result[0].length,
      );

// The serialized array is compatible with pretty-format package min option.
// However, items have default stringify depth (instead of depth - 1)
// so expected item looks consistent by itself and enclosed in the array.
export const printReceivedArrayContainExpectedItem = (
  received: Array<unknown>,
  index: number,
): string =>
  RECEIVED_COLOR(
    '[' +
      received
        .map((item, i) => {
          const stringified = stringify(item);
          return i === index ? INVERTED_COLOR(stringified) : stringified;
        })
        .join(', ') +
      ']',
  );

const shouldPrintDiff = (expected: unknown, received: unknown): boolean => {
  const expectedType = getType(expected);
  const receivedType = getType(received);

  if (expectedType !== receivedType) {
    return false;
  }

  if (isPrimitive(expected)) {
    // Print diff only if both strings have more than one line.
    return expectedType === 'string' && !isOneline(expected, received);
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

  return true;
};

const diffStrings = (a: string, b: string): Array<Diff> | null => {
  const isCommon = (aIndex: number, bIndex: number) => a[aIndex] === b[bIndex];

  let aIndex = 0;
  let bIndex = 0;
  const diffs = [];
  const foundSubsequence = (
    nCommon: number,
    aCommon: number,
    bCommon: number,
  ) => {
    if (aIndex !== aCommon) {
      diffs.push(new Diff(DIFF_DELETE, a.slice(aIndex, aCommon)));
    }
    if (bIndex !== bCommon) {
      diffs.push(new Diff(DIFF_INSERT, b.slice(bIndex, bCommon)));
    }

    aIndex = aCommon + nCommon; // number of characters compared in a
    bIndex = bCommon + nCommon; // number of characters compared in b
    diffs.push(new Diff(DIFF_COMMON, a.slice(aCommon, aIndex)));
  };

  diffSequences(a.length, b.length, isCommon, foundSubsequence);

  // After the last common subsequence, push remaining change items.
  if (aIndex !== a.length) {
    diffs.push(new Diff(DIFF_DELETE, a.slice(aIndex)));
  }
  if (bIndex !== b.length) {
    diffs.push(new Diff(DIFF_INSERT, b.slice(bIndex)));
  }

  cleanupSemantic(diffs);

  return diffs.length === 2 &&
    diffs[0][0] === DIFF_DELETE &&
    diffs[1][0] === DIFF_INSERT
    ? null
    : diffs;
};

const MULTILINE_REGEXP = /[\r\n]/;

const expectedInverter = (reduced: string, diff: Diff): string =>
  reduced +
  (diff[0] === DIFF_COMMON
    ? printSubstring(diff[1])
    : diff[0] === DIFF_DELETE
    ? INVERTED_COLOR(printSubstring(diff[1]))
    : '');

const receivedInverter = (reduced: string, diff: Diff): string =>
  reduced +
  (diff[0] === DIFF_COMMON
    ? printSubstring(diff[1])
    : diff[0] === DIFF_INSERT
    ? INVERTED_COLOR(printSubstring(diff[1]))
    : '');

export const printDiffOrStringify = (
  expected: unknown,
  received: unknown,
  expectedLabel: string,
  receivedLabel: string,
  expand?: boolean, // diff option: true if `--expand` CLI option
): string => {
  // Cannot use same serialization as shortcut to avoid diff,
  // because stringify (that is, pretty-format with min option)
  // omits constructor name for array or object, too bad so sad :(
  const difference = shouldPrintDiff(expected, received)
    ? diff(expected, received, {
        aAnnotation: expectedLabel,
        bAnnotation: receivedLabel,
        expand,
      }) // string | null
    : null;

  // Cannot reuse value of stringify(received) in report string,
  // because printReceived does inverse highlight space at end of line,
  // but RECEIVED_COLOR does not (it refers to a plain chalk method).
  if (
    typeof difference === 'string' &&
    difference.includes('- ' + expectedLabel) &&
    difference.includes('+ ' + receivedLabel)
  ) {
    return difference;
  }

  const printLabel = getLabelPrinter(expectedLabel, receivedLabel);

  if (
    typeof expected === 'string' &&
    typeof received === 'string' &&
    !MULTILINE_REGEXP.test(expected) &&
    !MULTILINE_REGEXP.test(received)
  ) {
    const diffs = diffStrings(expected, received);

    if (Array.isArray(diffs)) {
      return (
        `${printLabel(expectedLabel)}${EXPECTED_COLOR(
          diffs.reduce(expectedInverter, '"') + '"',
        )}\n` +
        `${printLabel(receivedLabel)}${RECEIVED_COLOR(
          diffs.reduce(receivedInverter, '"') + '"',
        )}`
      );
    }
  }

  return (
    `${printLabel(expectedLabel)}${printExpected(expected)}\n` +
    `${printLabel(receivedLabel)}${
      stringify(expected) === stringify(received)
        ? 'serializes to the same string'
        : printReceived(received)
    }`
  );
};

export const printExpectedConstructorName = (
  label: string,
  expected: Function,
) => printConstructorName(label, expected, false, true) + '\n';

export const printExpectedConstructorNameNot = (
  label: string,
  expected: Function,
) => printConstructorName(label, expected, true, true) + '\n';

export const printReceivedConstructorName = (
  label: string,
  received: Function,
) => printConstructorName(label, received, false, false) + '\n';

// Do not call function if received is equal to expected.
export const printReceivedConstructorNameNot = (
  label: string,
  received: Function,
  expected: Function,
) =>
  typeof expected.name === 'string' &&
  expected.name.length !== 0 &&
  typeof received.name === 'string' &&
  received.name.length !== 0
    ? printConstructorName(label, received, true, false) +
      ` ${
        Object.getPrototypeOf(received) === expected
          ? 'extends'
          : 'extends … extends'
      } ${EXPECTED_COLOR(expected.name)}` +
      '\n'
    : printConstructorName(label, received, false, false) + '\n';

const printConstructorName = (
  label: string,
  constructor: Function,
  isNot: boolean,
  isExpected: boolean,
): string =>
  typeof constructor.name !== 'string'
    ? `${label} name is not a string`
    : constructor.name.length === 0
    ? `${label} name is an empty string`
    : `${label}: ${!isNot ? '' : isExpected ? 'not ' : '    '}${
        isExpected
          ? EXPECTED_COLOR(constructor.name)
          : RECEIVED_COLOR(constructor.name)
      }`;
