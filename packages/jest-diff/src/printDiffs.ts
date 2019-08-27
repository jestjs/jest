/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from 'chalk';

import {
  DIFF_DELETE,
  DIFF_EQUAL,
  DIFF_INSERT,
  Diff,
  cleanupSemantic,
} from './cleanupSemantic';
import diffLines from './diffLines';
import diffStrings from './diffStrings';
import getAlignedDiffs from './getAlignedDiffs';
import {
  joinAlignedDiffsExpand,
  joinAlignedDiffsNoExpand,
} from './joinAlignedDiffs';
import {normalizeDiffOptions} from './normalizeDiffOptions';
import {DiffOptions, DiffOptionsNormalized} from './types';

export const INVERTED_COLOR = chalk.inverse; // export for joinAlignedDiffs test
const PATCH_COLOR = chalk.yellow;

// Given change op and array of diffs, return concatenated string:
// * include common strings
// * include change strings which have argument op (inverse highlight)
// * exclude change strings which have opposite op
export const invertChangedSubstrings = (
  op: number,
  diffs: Array<Diff>,
): string =>
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

const NEWLINE_SYMBOL = '\u{21B5}'; // downwards arrow with corner leftwards
const SPACE_SYMBOL = '\u{00B7}'; // middle dot

// Instead of inverse highlight which now implies a change,
// replace common spaces with middle dot at the end of the line.
const replaceSpacesAtEnd = (line: string): string =>
  line.replace(/\s+$/, spaces => SPACE_SYMBOL.repeat(spaces.length));

export const printDeleteLine = (
  line: string,
  {aColor, aSymbol}: DiffOptionsNormalized,
): string =>
  aColor(
    line.length !== 0 ? aSymbol + ' ' + replaceSpacesAtEnd(line) : aSymbol,
  );

export const printInsertLine = (
  line: string,
  {bColor, bSymbol}: DiffOptionsNormalized,
): string =>
  bColor(
    line.length !== 0 ? bSymbol + ' ' + replaceSpacesAtEnd(line) : bSymbol,
  );

// Prevent visually ambiguous empty line as the first or the last.
export const printCommonLine = (
  line: string,
  isFirstOrLast: boolean,
  {commonColor, commonSymbol}: DiffOptionsNormalized,
): string =>
  line.length !== 0
    ? commonColor(commonSymbol + ' ' + replaceSpacesAtEnd(line))
    : isFirstOrLast
    ? commonColor(commonSymbol + ' ' + NEWLINE_SYMBOL)
    : '';

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

export type ChangeCounts = {
  a: number;
  b: number;
};

const countChanges = (diffs: Array<Diff>): ChangeCounts => {
  let a = 0;
  let b = 0;

  diffs.forEach(diff => {
    switch (diff[0]) {
      case DIFF_DELETE:
        a += 1;
        break;

      case DIFF_INSERT:
        b += 1;
        break;
    }
  });

  return {a, b};
};

export const printAnnotation = (
  {
    aAnnotation,
    aColor,
    aSymbol,
    bAnnotation,
    bColor,
    bSymbol,
    includeChangeCounts,
    omitAnnotationLines,
  }: DiffOptionsNormalized,
  changeCounts: ChangeCounts,
): string => {
  if (omitAnnotationLines) {
    return '';
  }

  let aRest = '';
  let bRest = '';

  if (includeChangeCounts) {
    const aCount = String(changeCounts.a);
    const bCount = String(changeCounts.b);

    const aPadding =
      Math.max(bAnnotation.length - aAnnotation.length, 0) +
      Math.max(bCount.length - aCount.length, 0);
    const bPadding =
      Math.max(aAnnotation.length - bAnnotation.length, 0) +
      Math.max(aCount.length - bCount.length, 0);

    // Separate annotation from count by padding plus margin of 2 spaces.
    aRest = ' '.repeat(aPadding + 2) + aCount;
    bRest = ' '.repeat(bPadding + 2) + bCount;
  }

  return (
    aColor(aSymbol + ' ' + aAnnotation + aRest) +
    '\n' +
    bColor(bSymbol + ' ' + bAnnotation + bRest) +
    '\n\n'
  );
};

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

// Given two string arguments, compare them character-by-character.
// Format as comparison lines in which changed substrings have inverse colors.
export const diffStringsUnified = (
  a: string,
  b: string,
  options?: DiffOptions,
): string => {
  const optionsNormalized = normalizeDiffOptions(options);

  if (a.length === 0 || b.length === 0) {
    const lines: Array<string> = [];
    const changeCounts: ChangeCounts = {
      a: 0,
      b: 0,
    };

    if (a.length !== 0) {
      // All comparison lines have aColor and aSymbol.
      a.split('\n').forEach(line => {
        lines.push(printDeleteLine(line, optionsNormalized));
      });
      changeCounts.a = lines.length;
    }

    if (b.length !== 0) {
      // All comparison lines have bColor and bSymbol.
      b.split('\n').forEach(line => {
        lines.push(printInsertLine(line, optionsNormalized));
      });
      changeCounts.b = lines.length;
    }

    // Else if both are empty strings, there are no comparison lines.

    return printAnnotation(optionsNormalized, changeCounts) + lines.join('\n');
  }

  if (a === b) {
    const lines = a.split('\n');
    const iLast = lines.length - 1;
    const changeCounts = {
      a: 0,
      b: 0,
    };

    // All comparison lines have commonColor and commonSymbol.
    return (
      printAnnotation(optionsNormalized, changeCounts) +
      lines
        .map((line, i) =>
          printCommonLine(line, i === 0 || i === iLast, optionsNormalized),
        )
        .join('\n')
    );
  }

  const isMultiline = a.includes('\n') || b.includes('\n');

  // getAlignedDiffs assumes that a newline was appended to the strings.
  const diffs = diffStringsRaw(
    isMultiline ? a + '\n' : a,
    isMultiline ? b + '\n' : b,
    true, // cleanupSemantic
  );

  if (hasCommonDiff(diffs, isMultiline)) {
    const lines = getAlignedDiffs(diffs);
    return (
      printAnnotation(optionsNormalized, countChanges(lines)) +
      (optionsNormalized.expand
        ? joinAlignedDiffsExpand(lines, optionsNormalized)
        : joinAlignedDiffsNoExpand(lines, optionsNormalized))
    );
  }

  // Fall back to line-by-line diff.
  // Given strings, it returns a string, not null.
  return diffLines(a, b, optionsNormalized) as string;
};

// Given two string arguments, compare them character-by-character.
// Optionally clean up small common substrings, also known as chaff.
// Return an array of diff objects.
export const diffStringsRaw = (
  a: string,
  b: string,
  cleanup: boolean,
): Array<Diff> => {
  const diffs = diffStrings(a, b);

  if (cleanup) {
    cleanupSemantic(diffs); // impure function
  }

  return diffs;
};
