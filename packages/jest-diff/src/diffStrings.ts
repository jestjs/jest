/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import diffSequences from '@jest/diff-sequences';
import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT, Diff} from './cleanupSemantic';

const diffStrings = (a: string, b: string): Array<Diff> => {
  // Split strings into code points to handle surrogate pairs.
  const aCodepoints = [...a];
  const bCodepoints = [...b];
  const isCommon = (aIndex: number, bIndex: number) =>
    aCodepoints[aIndex] === bCodepoints[bIndex];

  let aIndex = 0;
  let bIndex = 0;
  const diffs: Array<Diff> = [];

  const foundSubsequence = (
    nCommon: number,
    aCommon: number,
    bCommon: number,
  ) => {
    if (aIndex !== aCommon) {
      diffs.push(
        new Diff(DIFF_DELETE, aCodepoints.slice(aIndex, aCommon).join('')),
      );
    }
    if (bIndex !== bCommon) {
      diffs.push(
        new Diff(DIFF_INSERT, bCodepoints.slice(bIndex, bCommon).join('')),
      );
    }

    aIndex = aCommon + nCommon; // number of characters compared in a
    bIndex = bCommon + nCommon; // number of characters compared in b
    diffs.push(
      new Diff(DIFF_EQUAL, bCodepoints.slice(bCommon, bIndex).join('')),
    );
  };

  diffSequences(
    aCodepoints.length,
    bCodepoints.length,
    isCommon,
    foundSubsequence,
  );

  // After the last common subsequence, push remaining change items.
  if (aIndex !== aCodepoints.length) {
    diffs.push(new Diff(DIFF_DELETE, aCodepoints.slice(aIndex).join('')));
  }
  if (bIndex !== bCodepoints.length) {
    diffs.push(new Diff(DIFF_INSERT, bCodepoints.slice(bIndex).join('')));
  }

  return diffs;
};

export default diffStrings;
