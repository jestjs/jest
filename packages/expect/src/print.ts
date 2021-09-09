/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable local/ban-types-eventually */

import {
  EXPECTED_COLOR,
  INVERTED_COLOR,
  RECEIVED_COLOR,
  printReceived,
  stringify,
} from 'jest-matcher-utils';
import type {PrintObject} from './types';

// Format substring but do not enclose in double quote marks.
// The replacement is compatible with pretty-format package.
const printSubstring = (val: string): string => val.replace(/"|\\/g, '\\$&');

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

const print: PrintObject = {
  closeTo: (receivedDiff, expectedDiff, precision, isNot) => {
    const receivedDiffString = stringify(receivedDiff);
    const expectedDiffString = receivedDiffString.includes('e')
      ? // toExponential arg is number of digits after the decimal point.
        expectedDiff.toExponential(0)
      : 0 <= precision && precision < 20
      ? // toFixed arg is number of digits after the decimal point.
        // It may be a value between 0 and 20 inclusive.
        // Implementations may optionally support a larger range of values.
        expectedDiff.toFixed(precision + 1)
      : stringify(expectedDiff);

    return (
      `Expected precision:  ${isNot ? '    ' : ''}  ${stringify(precision)}\n` +
      `Expected difference: ${isNot ? 'not ' : ''}< ${EXPECTED_COLOR(
        expectedDiffString,
      )}\n` +
      `Received difference: ${isNot ? '    ' : ''}  ${RECEIVED_COLOR(
        receivedDiffString,
      )}`
    );
  },

  expectedConstructorName: (label, expected) =>
    printConstructorName(label, expected, false, true) + '\n',

  expectedConstructorNameNot: (label, expected) =>
    printConstructorName(label, expected, true, true) + '\n',

  // The serialized array is compatible with pretty-format package min option.
  // However, items have default stringify depth (instead of depth - 1)
  // so expected item looks consistent by itself and enclosed in the array.
  receivedArrayContainExpectedItem: (received, index) =>
    RECEIVED_COLOR(
      '[' +
        received
          .map((item, i) => {
            const stringified = stringify(item);
            return i === index ? INVERTED_COLOR(stringified) : stringified;
          })
          .join(', ') +
        ']',
    ),

  receivedConstructorName: (label, received) =>
    printConstructorName(label, received, false, false) + '\n',

  // Do not call function if received is equal to expected.
  receivedConstructorNameNot: (label, received, expected): string =>
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
      : printConstructorName(label, received, false, false) + '\n',

  receivedStringContainExpectedResult: (received, result) =>
    result === null
      ? printReceived(received)
      : print.receivedStringContainExpectedSubstring(
          received,
          result.index,
          result[0].length,
        ),

  receivedStringContainExpectedSubstring: (
    received,
    start,
    length, // not end
  ) =>
    RECEIVED_COLOR(
      '"' +
        printSubstring(received.slice(0, start)) +
        INVERTED_COLOR(printSubstring(received.slice(start, start + length))) +
        printSubstring(received.slice(start + length)) +
        '"',
    ),
};

export default print;
