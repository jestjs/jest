/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
import {getState} from './jestMatchersObject';

// Format substring but do not enclose in double quote marks.
// The replacement is compatible with pretty-format package.
const printSubstring = (val: string): string => val.replace(/"|\\/g, '\\$&');

export const printReceivedStringContainExpectedSubstring = (
  received: string,
  start: number,
  length: number, // not end
): string => {
  const {diffOptions} = getState();

  const receivedColor = diffOptions?.bColor ?? RECEIVED_COLOR;
  const invertedColor = diffOptions?.changeColor ?? INVERTED_COLOR;

  return receivedColor(
    `"${printSubstring(received.slice(0, start))}${invertedColor(
      printSubstring(received.slice(start, start + length)),
    )}${printSubstring(received.slice(start + length))}"`,
  );
};

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
): string => {
  const {diffOptions} = getState();

  const receivedColor = diffOptions?.bColor ?? RECEIVED_COLOR;
  const invertedColor = diffOptions?.changeColor ?? INVERTED_COLOR;

  return receivedColor(
    `[${received
      .map((item, i) => {
        const stringified = stringify(item);
        return i === index ? invertedColor(stringified) : stringified;
      })
      .join(', ')}]`,
  );
};

export const printCloseTo = (
  receivedDiff: number,
  expectedDiff: number,
  precision: number,
  isNot: boolean | undefined,
): string => {
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

  const {diffOptions} = getState();

  const expectedColor = diffOptions?.aColor ?? EXPECTED_COLOR;
  const receivedColor = diffOptions?.bColor ?? RECEIVED_COLOR;

  return (
    `Expected precision:  ${isNot ? '    ' : ''}  ${stringify(precision)}\n` +
    `Expected difference: ${isNot ? 'not ' : ''}< ${expectedColor(
      expectedDiffString,
    )}\n` +
    `Received difference: ${isNot ? '    ' : ''}  ${receivedColor(
      receivedDiffString,
    )}`
  );
};

export const printExpectedConstructorName = (
  label: string,
  expected: Function,
): string => `${printConstructorName(label, expected, false, true)}\n`;

export const printExpectedConstructorNameNot = (
  label: string,
  expected: Function,
): string => `${printConstructorName(label, expected, true, true)}\n`;

export const printReceivedConstructorName = (
  label: string,
  received: Function,
): string => `${printConstructorName(label, received, false, false)}\n`;

// Do not call function if received is equal to expected.
export const printReceivedConstructorNameNot = (
  label: string,
  received: Function,
  expected: Function,
): string => {
  const {diffOptions} = getState();
  const expectedColor = diffOptions?.aColor ?? EXPECTED_COLOR;

  return typeof expected.name === 'string' &&
    expected.name.length !== 0 &&
    typeof received.name === 'string' &&
    received.name.length !== 0
    ? `${printConstructorName(label, received, true, false)} ${
        Object.getPrototypeOf(received) === expected
          ? 'extends'
          : 'extends … extends'
      } ${expectedColor(expected.name)}\n`
    : `${printConstructorName(label, received, false, false)}\n`;
};

const printConstructorName = (
  label: string,
  constructor: Function,
  isNot: boolean,
  isExpected: boolean,
): string => {
  const {diffOptions} = getState();
  const expectedColor = diffOptions?.aColor ?? EXPECTED_COLOR;
  const receivedColor = diffOptions?.bColor ?? RECEIVED_COLOR;

  return typeof constructor.name !== 'string'
    ? `${label} name is not a string`
    : constructor.name.length === 0
    ? `${label} name is an empty string`
    : `${label}: ${!isNot ? '' : isExpected ? 'not ' : '    '}${
        isExpected
          ? expectedColor(constructor.name)
          : receivedColor(constructor.name)
      }`;
};
