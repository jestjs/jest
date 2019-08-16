/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import diff, {diffStringsAligned, diffStringsUnaligned} from 'jest-diff';
import getType, {isPrimitive} from 'jest-get-type';
import {
  EXPECTED_COLOR,
  RECEIVED_COLOR,
  getLabelPrinter,
  printDiffOrStringify,
} from 'jest-matcher-utils';
import prettyFormat from 'pretty-format';
import {unescape} from './utils';

const isLineDiffable = (received: any): boolean => {
  const receivedType = getType(received);

  if (isPrimitive(received)) {
    return typeof received === 'string' && received.includes('\n');
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
  expectedSerializedTrimmed: string,
  receivedSerializedTrimmed: string,
  received: unknown,
  expectedLabel: string,
  receivedLabel: string,
  expand: boolean, // CLI options: true if `--expand` or false if `--no-expand`
): string => {
  if (typeof received === 'string') {
    if (
      expectedSerializedTrimmed.length >= 2 &&
      expectedSerializedTrimmed.startsWith('"') &&
      expectedSerializedTrimmed.endsWith('"') &&
      receivedSerializedTrimmed === unescape(prettyFormat(received))
    ) {
      // The expected snapshot looks like a stringified string.
      // The received serialization is default stringified string.

      // Undo default serialization of expected snapshot:
      // Remove enclosing double quote marks.
      // Remove backslash escape preceding backslash here,
      // because unescape replaced it only preceding double quote mark.
      return printDiffOrStringify(
        expectedSerializedTrimmed.slice(1, -1).replace(/\\\\/g, '\\'),
        received,
        expectedLabel,
        receivedLabel,
        expand,
      );
    }

    // Display substring highlight even when strings have custom serialization.
    if (
      expectedSerializedTrimmed.length !== 0 &&
      receivedSerializedTrimmed.length !== 0 &&
      expectedSerializedTrimmed.length <= MAX_DIFF_STRING_LENGTH &&
      receivedSerializedTrimmed.length <= MAX_DIFF_STRING_LENGTH &&
      expectedSerializedTrimmed !== receivedSerializedTrimmed
    ) {
      if (
        expectedSerializedTrimmed.includes('\n') ||
        receivedSerializedTrimmed.includes('\n')
      ) {
        return diffStringsAligned(
          expectedSerializedTrimmed,
          receivedSerializedTrimmed,
          {
            aAnnotation: expectedLabel,
            bAnnotation: receivedLabel,
            expand,
          },
        );
      }

      // Format the changed substrings using inverse from the chalk package.
      const [expected2, received2] = diffStringsUnaligned(
        expectedSerializedTrimmed,
        receivedSerializedTrimmed,
      );

      // Because not default stringify, call EXPECTED_COLOR and RECEIVED_COLOR
      // This is reason to call diffStringsUnaligned instead of printDiffOrStringify
      // Because there is no closing double quote mark at end of single lines,
      // future improvement is to call replaceSpacesAtEnd if it becomes public.
      const printLabel = getLabelPrinter(expectedLabel, receivedLabel);
      const expectedLine =
        printLabel(expectedLabel) + EXPECTED_COLOR(expected2);
      const receivedLine =
        printLabel(receivedLabel) + RECEIVED_COLOR(received2);

      return expectedLine + '\n' + receivedLine;
    }
  }

  if (
    (expectedSerializedTrimmed.includes('\n') ||
      receivedSerializedTrimmed.includes('\n')) &&
    isLineDiffable(received)
  ) {
    return diff(expectedSerializedTrimmed, receivedSerializedTrimmed, {
      aAnnotation: expectedLabel,
      bAnnotation: receivedLabel,
      expand,
    }) as string;
  }

  const printLabel = getLabelPrinter(expectedLabel, receivedLabel);
  return (
    printLabel(expectedLabel) +
    EXPECTED_COLOR(expectedSerializedTrimmed) +
    '\n' +
    printLabel(receivedLabel) +
    RECEIVED_COLOR(receivedSerializedTrimmed)
  );
};
