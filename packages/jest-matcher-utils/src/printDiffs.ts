/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  cleanupSemantic,
  DIFF_EQUAL,
  DIFF_DELETE,
  DIFF_INSERT,
  Diff,
} from './cleanupSemantic';
import diffStrings from './diffStrings';
import getAlignedDiffs from './getAlignedDiffs';
import {
  joinAlignedDiffsExpand,
  joinAlignedDiffsNoExpand,
} from './joinAlignedDiffs';
import {
  DIM_COLOR,
  EXPECTED_COLOR,
  INVERTED_COLOR,
  RECEIVED_COLOR,
} from './index';

// Given change op and array of diffs, return concatenated string:
// * include common strings
// * include change strings which have argument op (inverse highlight)
// * exclude change strings which have opposite op
export const getDiffString = (op: number, diffs: Array<Diff>): string =>
  diffs.reduce(
    (reduced: string, diff: Diff): string =>
      reduced +
      (diff[0] === DIFF_EQUAL
        ? diff[1]
        : diff[0] === op
        ? INVERTED_COLOR(diff[1])
        : ''),
    '',
  );

export const getExpectedString = (diffs: Array<Diff>): string =>
  getDiffString(DIFF_DELETE, diffs);

export const getReceivedString = (diffs: Array<Diff>): string =>
  getDiffString(DIFF_INSERT, diffs);

export const MULTILINE_REGEXP = /\n/;

const NEWLINE_SYMBOL = '\u{21B5}'; // downwards arrow with corner leftwards
export const SPACE_SYMBOL = '\u{00B7}'; // middle dot

// Instead of inverse highlight which now implies a change,
// replace common spaces with middle dot at the end of the line.
const replaceSpacesAtEnd = (line: string): string =>
  line.replace(/\s+$/, spaces => SPACE_SYMBOL.repeat(spaces.length));

export const printDeleteLine = (line: string) =>
  EXPECTED_COLOR(line.length !== 0 ? '- ' + replaceSpacesAtEnd(line) : '-');

export const printInsertLine = (line: string) =>
  RECEIVED_COLOR(line.length !== 0 ? '+ ' + replaceSpacesAtEnd(line) : '+');

// Prevent visually ambiguous empty line as the first or the last.
export const printCommonLine = (line: string, isFirstOrLast: boolean = false) =>
  line.length !== 0
    ? DIM_COLOR('  ' + replaceSpacesAtEnd(line))
    : isFirstOrLast
    ? DIM_COLOR('  ' + NEWLINE_SYMBOL)
    : '';

export const computeStringDiffs = (expected: string, received: string) => {
  const isMultiline =
    MULTILINE_REGEXP.test(expected) || MULTILINE_REGEXP.test(received);

  // getAlignedDiffs assumes that a newline was appended to the strings.
  if (isMultiline) {
    expected += '\n';
    received += '\n';
  }

  const diffs = diffStrings(expected, received);
  cleanupSemantic(diffs); // impure function

  return {diffs, isMultiline};
};

// Return formatted diff lines without labels.
export const printMultilineStringDiffs = (
  diffs: Array<Diff>,
  expand: boolean,
): string => {
  const lines = getAlignedDiffs(diffs);
  return expand
    ? joinAlignedDiffsExpand(lines)
    : joinAlignedDiffsNoExpand(lines);
};
