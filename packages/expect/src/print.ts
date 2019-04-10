/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import getType, {isPrimitive} from 'jest-get-type';
import {
  INVERTED_COLOR,
  RECEIVED_COLOR,
  diff,
  printExpected,
  printReceived,
  stringify,
} from 'jest-matcher-utils';
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

export const printDiffOrStringify = (
  expected: unknown,
  received: unknown,
  expectedLabel: string, // include colon and one or more spaces,
  receivedLabel: string, // same as returned by getLabelPrinter
  expand?: boolean, // diff option: true if `--expand` CLI option
): string => {
  // Cannot use same serialization as shortcut to avoid diff,
  // because stringify (that is, pretty-format with min option)
  // omits constructor name for array or object, too bad so sad :(
  const difference = shouldPrintDiff(expected, received)
    ? diff(expected, received, {expand}) // string | null
    : null;

  // Cannot reuse value of stringify(received) in report string,
  // because printReceived does inverse highlight space at end of line,
  // but RECEIVED_COLOR does not (it refers to a plain chalk method).
  return typeof difference === 'string' && difference.includes('- Expected')
    ? difference
    : `${expectedLabel}${printExpected(expected)}\n` +
        `${receivedLabel}${
          stringify(expected) === stringify(received)
            ? 'has same serialization'
            : printReceived(received)
        }`;
};
