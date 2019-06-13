/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from 'chalk';

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
import {DiffOptions} from './types';

export const DIM_COLOR = chalk.dim;
export const EXPECTED_COLOR = chalk.green;
export const INVERTED_COLOR = chalk.inverse;
export const RECEIVED_COLOR = chalk.red;
const PATCH_COLOR = chalk.yellow;

// Given change op and array of diffs, return concatenated string:
// * include common strings
// * include change strings which have argument op (inverse highlight)
// * exclude change strings which have opposite op
export const getHighlightedString = (op: number, diffs: Array<Diff>): string =>
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
  getHighlightedString(DIFF_DELETE, diffs);

export const getReceivedString = (diffs: Array<Diff>): string =>
  getHighlightedString(DIFF_INSERT, diffs);

export const MULTILINE_REGEXP = /\n/;

const NEWLINE_SYMBOL = '\u{21B5}'; // downwards arrow with corner leftwards
const SPACE_SYMBOL = '\u{00B7}'; // middle dot

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

export const hasCommonDiff = (diffs: Array<Diff>, isMultiline: boolean) => {
  if (isMultiline) {
    // Important: Ignore common newline that was appended to multiline strings!
    const iLast = diffs.length - 1;
    return diffs.some(
      (diff, i) => diff[0] === DIFF_EQUAL && (i !== iLast || diff[1] !== '\n'),
    );
  }

  return diffs.some(diff => diff[0] === DIFF_EQUAL);
};

export const printAnnotation = (options?: DiffOptions): string =>
  EXPECTED_COLOR('- ' + ((options && options.aAnnotation) || 'Expected')) +
  '\n' +
  RECEIVED_COLOR('+ ' + ((options && options.bAnnotation) || 'Received')) +
  '\n\n';

// In GNU diff format, indexes are one-based instead of zero-based.
export const createPatchMark = (
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): string =>
  PATCH_COLOR(
    `@@ -${aStart + 1},${aEnd - aStart} +${bStart + 1},${bEnd - bStart} @@`,
  );

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

const MAX_DIFF_STRING_LENGTH = 20000;

type StringDiffResult =
  | {isMultiline: true; annotatedDiff: string}
  | {isMultiline: false; a: string; b: string}
  | null;

// Print specific substring diff for strings only:
// * if strings are not equal
// * if neither string is empty
// * if neither string is too long
// * if there is a common string after semantic cleanup
export const getStringDiff = (
  expected: string,
  received: string,
  options?: DiffOptions,
): StringDiffResult => {
  if (
    expected === received ||
    expected.length === 0 ||
    received.length === 0 ||
    expected.length > MAX_DIFF_STRING_LENGTH ||
    received.length > MAX_DIFF_STRING_LENGTH
  ) {
    return null;
  }

  const {diffs, isMultiline} = computeStringDiffs(expected, received);

  if (!hasCommonDiff(diffs, isMultiline)) {
    return null;
  }

  return isMultiline
    ? {
        annotatedDiff:
          printAnnotation(options) +
          printMultilineStringDiffs(
            diffs,
            options === undefined || options.expand !== false,
          ),
        isMultiline,
      }
    : {
        a: getExpectedString(diffs),
        b: getReceivedString(diffs),
        isMultiline,
      };
};
