/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {diffLinesUnified, diffStringsUnified, splitLines0} from 'jest-diff';
import getType = require('jest-get-type');
import {
  EXPECTED_COLOR,
  RECEIVED_COLOR,
  getLabelPrinter,
} from 'jest-matcher-utils';
import prettyFormat = require('pretty-format');
import {unstringifyString} from './utils';

const isLineDiffable = (received: any): boolean => {
  const receivedType = getType(received);

  if (getType.isPrimitive(received)) {
    return typeof received === 'string';
  }

  if (
    receivedType === 'date' ||
    receivedType === 'function' ||
    receivedType === 'regexp'
  ) {
    return false;
  }

  if (received instanceof Error) {
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

export const printDiffOrStringified = (
  a: string, // snapshot without extra line breaks
  b: string, // received serialized but without extra line breaks
  received: unknown,
  expand: boolean, // CLI options: true if `--expand` or false if `--no-expand`
): string => {
  const aAnnotation = 'Snapshot';
  const bAnnotation = 'Received';
  const aColor = EXPECTED_COLOR;
  const bColor = RECEIVED_COLOR;
  const options = {
    aAnnotation,
    aColor,
    bAnnotation,
    bColor,
    expand,
    includeChangeCounts: true,
  };

  if (typeof received === 'string') {
    if (
      a.length >= 2 &&
      a.startsWith('"') &&
      a.endsWith('"') &&
      b === prettyFormat(received)
    ) {
      // If snapshot looks like default serialization of a string
      // and received is string which has default serialization, then replace:
      a = unstringifyString(a); //  hypothetical unserialized expected string
      b = received; // not serialized
    }
    // else expected had custom serialization or was not a string
    // or received has custom serialization

    return a.length <= MAX_DIFF_STRING_LENGTH &&
      b.length <= MAX_DIFF_STRING_LENGTH
      ? diffStringsUnified(a, b, options)
      : diffLinesUnified(splitLines0(a), splitLines0(b), options);
  }

  if (isLineDiffable(received)) {
    // TODO future PR will replace with diffLinesUnified2 to ignore indentation
    return diffLinesUnified(splitLines0(a), splitLines0(b), options);
  }

  const printLabel = getLabelPrinter(aAnnotation, bAnnotation);
  return (
    printLabel(aAnnotation) +
    aColor(a) +
    '\n' +
    printLabel(bAnnotation) +
    bColor(b)
  );
};
