/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  DIFF_DELETE,
  DIFF_EQUAL,
  DIFF_INSERT,
  Diff,
  cleanupSemantic,
} from './cleanupSemantic';
import {diffLinesUnified} from './diffLines';
import diffStrings from './diffStrings';
import getAlignedDiffs from './getAlignedDiffs';
import {
  joinAlignedDiffsExpand,
  joinAlignedDiffsNoExpand,
} from './joinAlignedDiffs';
import {normalizeDiffOptions} from './normalizeDiffOptions';
import {DiffOptions, DiffOptionsColor, DiffOptionsNormalized} from './types';

const formatTrailingSpaces = (
  line: string,
  trailingSpaceFormatter: DiffOptionsColor,
): string => line.replace(/\s+$/, match => trailingSpaceFormatter(match));

const printDiffLine = (
  line: string,
  isFirstOrLast: boolean,
  color: DiffOptionsColor,
  indicator: string,
  firstOrLastEmptyLineReplacement: string,
  trailingSpaceFormatter: DiffOptionsColor,
): string =>
  line.length !== 0
    ? color(
        indicator + ' ' + formatTrailingSpaces(line, trailingSpaceFormatter),
      )
    : indicator !== ' '
    ? color(indicator)
    : isFirstOrLast && firstOrLastEmptyLineReplacement.length !== 0
    ? color(indicator + ' ' + firstOrLastEmptyLineReplacement)
    : '';

export const printDeleteLine = (
  line: string,
  isFirstOrLast: boolean,
  {
    aColor,
    aIndicator,
    firstOrLastEmptyLineReplacement,
    trailingSpaceFormatter,
  }: DiffOptionsNormalized,
): string =>
  printDiffLine(
    line,
    isFirstOrLast,
    aColor,
    aIndicator,
    firstOrLastEmptyLineReplacement,
    trailingSpaceFormatter,
  );

export const printInsertLine = (
  line: string,
  isFirstOrLast: boolean,
  {
    bColor,
    bIndicator,
    firstOrLastEmptyLineReplacement,
    trailingSpaceFormatter,
  }: DiffOptionsNormalized,
): string =>
  printDiffLine(
    line,
    isFirstOrLast,
    bColor,
    bIndicator,
    firstOrLastEmptyLineReplacement,
    trailingSpaceFormatter,
  );

export const printCommonLine = (
  line: string,
  isFirstOrLast: boolean,
  {
    commonColor,
    commonIndicator,
    firstOrLastEmptyLineReplacement,
    trailingSpaceFormatter,
  }: DiffOptionsNormalized,
): string =>
  printDiffLine(
    line,
    isFirstOrLast,
    commonColor,
    commonIndicator,
    firstOrLastEmptyLineReplacement,
    trailingSpaceFormatter,
  );

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

export const countChanges = (diffs: Array<Diff>): ChangeCounts => {
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
    aIndicator,
    bAnnotation,
    bColor,
    bIndicator,
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
    aRest = ' '.repeat(aPadding + 2) + aCount + ' ' + aIndicator;
    bRest = ' '.repeat(bPadding + 2) + bCount + ' ' + bIndicator;
  }

  return (
    aColor(aIndicator + ' ' + aAnnotation + aRest) +
    '\n' +
    bColor(bIndicator + ' ' + bAnnotation + bRest) +
    '\n\n'
  );
};

export const printDiffLines = (
  diffs: Array<Diff>,
  options: DiffOptionsNormalized,
): string =>
  printAnnotation(options, countChanges(diffs)) +
  (options.expand
    ? joinAlignedDiffsExpand(diffs, options)
    : joinAlignedDiffsNoExpand(diffs, options));

// In GNU diff format, indexes are one-based instead of zero-based.
export const createPatchMark = (
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
  {patchColor}: DiffOptionsNormalized,
): string =>
  patchColor(
    `@@ -${aStart + 1},${aEnd - aStart} +${bStart + 1},${bEnd - bStart} @@`,
  );

export const splitLines0 = (string: string) =>
  string.length === 0 ? [] : string.split('\n');

// Compare two strings character-by-character.
// Format as comparison lines in which changed substrings have inverse colors.
export const diffStringsUnified = (
  a: string,
  b: string,
  options?: DiffOptions,
): string => {
  if (a !== b && a.length !== 0 && b.length !== 0) {
    const isMultiline = a.includes('\n') || b.includes('\n');

    // getAlignedDiffs assumes that a newline was appended to the strings.
    const diffs = diffStringsRaw(
      isMultiline ? a + '\n' : a,
      isMultiline ? b + '\n' : b,
      true, // cleanupSemantic
    );

    if (hasCommonDiff(diffs, isMultiline)) {
      const optionsNormalized = normalizeDiffOptions(options);
      const lines = getAlignedDiffs(diffs, optionsNormalized.changeColor);
      return printDiffLines(lines, optionsNormalized);
    }
  }

  // Fall back to line-by-line diff.
  return diffLinesUnified(splitLines0(a), splitLines0(b), options);
};

// Compare two strings character-by-character.
// Optionally clean up small common substrings, also known as chaff.
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
