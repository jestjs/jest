/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import diff from 'diff-sequences';
import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT, Diff} from './cleanupSemantic';
import {normalizeDiffOptions} from './normalizeDiffOptions';
import {printDiffLines} from './printDiffs';
import type {DiffOptions} from './types';

const isEmptyString = (lines: Array<string>) =>
  lines.length === 1 && lines[0].length === 0;

// Compare two arrays of strings line-by-line. Format as comparison lines.
export const diffLinesUnified = (
  aLines: Array<string>,
  bLines: Array<string>,
  options?: DiffOptions,
): string =>
  printDiffLines(
    diffLinesRaw(
      isEmptyString(aLines) ? [] : aLines,
      isEmptyString(bLines) ? [] : bLines,
    ),
    normalizeDiffOptions(options),
  );

// Given two pairs of arrays of strings:
// Compare the pair of comparison arrays line-by-line.
// Format the corresponding lines in the pair of displayable arrays.
export const diffLinesUnified2 = (
  aLinesDisplay: Array<string>,
  bLinesDisplay: Array<string>,
  aLinesCompare: Array<string>,
  bLinesCompare: Array<string>,
  options?: DiffOptions,
): string => {
  if (isEmptyString(aLinesDisplay) && isEmptyString(aLinesCompare)) {
    aLinesDisplay = [];
    aLinesCompare = [];
  }
  if (isEmptyString(bLinesDisplay) && isEmptyString(bLinesCompare)) {
    bLinesDisplay = [];
    bLinesCompare = [];
  }

  if (
    aLinesDisplay.length !== aLinesCompare.length ||
    bLinesDisplay.length !== bLinesCompare.length
  ) {
    // Fall back to diff of display lines.
    return diffLinesUnified(aLinesDisplay, bLinesDisplay, options);
  }

  const diffs = diffLinesRaw(aLinesCompare, bLinesCompare);

  // Replace comparison lines with displayable lines.
  let aIndex = 0;
  let bIndex = 0;
  diffs.forEach((diff: Diff) => {
    switch (diff[0]) {
      case DIFF_DELETE:
        diff[1] = aLinesDisplay[aIndex];
        aIndex += 1;
        break;

      case DIFF_INSERT:
        diff[1] = bLinesDisplay[bIndex];
        bIndex += 1;
        break;

      default:
        diff[1] = bLinesDisplay[bIndex];
        aIndex += 1;
        bIndex += 1;
    }
  });

  return printDiffLines(diffs, normalizeDiffOptions(options));
};

// Compare two arrays of strings line-by-line.
export const diffLinesRaw = (
  aLines: Array<string>,
  bLines: Array<string>,
): Array<Diff> => {
  const aLength = aLines.length;
  const bLength = bLines.length;

  const isCommon = (aIndex: number, bIndex: number) =>
    aLines[aIndex] === bLines[bIndex];

  const diffs: Array<Diff> = [];
  let aIndex = 0;
  let bIndex = 0;

  const foundSubsequence = (
    nCommon: number,
    aCommon: number,
    bCommon: number,
  ) => {
    for (; aIndex !== aCommon; aIndex += 1) {
      diffs.push(new Diff(DIFF_DELETE, aLines[aIndex]));
    }
    for (; bIndex !== bCommon; bIndex += 1) {
      diffs.push(new Diff(DIFF_INSERT, bLines[bIndex]));
    }
    for (; nCommon !== 0; nCommon -= 1, aIndex += 1, bIndex += 1) {
      diffs.push(new Diff(DIFF_EQUAL, bLines[bIndex]));
    }
  };

  diff(aLength, bLength, isCommon, foundSubsequence);

  // After the last common subsequence, push remaining change items.
  for (; aIndex !== aLength; aIndex += 1) {
    diffs.push(new Diff(DIFF_DELETE, aLines[aIndex]));
  }
  for (; bIndex !== bLength; bIndex += 1) {
    diffs.push(new Diff(DIFF_INSERT, bLines[bIndex]));
  }

  return diffs;
};
