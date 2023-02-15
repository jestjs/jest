/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import diffSequences from 'diff-sequences';
import {DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT, Diff} from './cleanupSemantic';

const diffStrings = (a: string, b: string): Array<Diff> => {
  const isCommon = (aIndex: number, bIndex: number) => a[aIndex] === b[bIndex];

  let aIndex = 0;
  let bIndex = 0;
  const diffs: Array<Diff> = [];

  const foundSubsequence = (
    nCommon: number,
    aCommon: number,
    bCommon: number,
  ) => {
    if (aIndex !== aCommon) {
      diffs.push(new Diff(DIFF_DELETE, a.slice(aIndex, aCommon)));
    }
    if (bIndex !== bCommon) {
      diffs.push(new Diff(DIFF_INSERT, b.slice(bIndex, bCommon)));
    }

    aIndex = aCommon + nCommon; // number of characters compared in a
    bIndex = bCommon + nCommon; // number of characters compared in b
    diffs.push(new Diff(DIFF_EQUAL, b.slice(bCommon, bIndex)));
  };

  diffSequences(a.length, b.length, isCommon, foundSubsequence);

  // After the last common subsequence, push remaining change items.
  if (aIndex !== a.length) {
    diffs.push(new Diff(DIFF_DELETE, a.slice(aIndex)));
  }
  if (bIndex !== b.length) {
    diffs.push(new Diff(DIFF_INSERT, b.slice(bIndex)));
  }

  return diffs;
};

export default diffStrings;
