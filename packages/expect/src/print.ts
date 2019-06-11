/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  EXPECTED_COLOR,
  INVERTED_COLOR,
  RECEIVED_COLOR,
  printReceived,
  stringify,
} from 'jest-matcher-utils';

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
