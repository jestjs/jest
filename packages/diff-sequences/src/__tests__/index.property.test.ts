/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {fc, it} from '@fast-check/jest';
import diff from '../';

const findCommonItems = (a: Array<string>, b: Array<string>): Array<string> => {
  const array: Array<string> = [];
  diff(
    a.length,
    b.length,
    (aIndex: number, bIndex: number) => a[aIndex] === b[bIndex],
    (nCommon: number, aCommon: number) => {
      for (; nCommon !== 0; nCommon -= 1, aCommon += 1) {
        array.push(a[aCommon]);
      }
    },
  );
  return array;
};

const extractCount = (data: Array<string>): Map<string, number> => {
  const countPerChar = new Map<string, number>();
  for (const item of data) {
    const currentCount = countPerChar.get(item) ?? 0;
    countPerChar.set(item, currentCount + 1);
  }
  return countPerChar;
};

const flatten = (data: Array<Array<string>>) => {
  const array: Array<string> = [];
  for (const items of data) {
    array.push(...items);
  }
  return array;
};

const isSubsequenceOf = (
  subsequence: Array<string>,
  sequence: Array<string>,
): boolean => {
  let iSub = 0;
  for (let iSeq = 0; iSeq !== sequence.length; iSeq += 1) {
    if (iSub !== subsequence.length && subsequence[iSub] === sequence[iSeq]) {
      iSub += 1;
    }
  }

  return iSub === subsequence.length;
};

it.prop([fc.array(fc.char())])('should be reflexive', a => {
  expect(findCommonItems(a, a)).toEqual(a);
});

it.prop([fc.array(fc.char()), fc.array(fc.char())])(
  'should find the same number of common items when switching the inputs',
  // findCommonItems is not symmetric as:
  // > findCommonItems(["Z"," "], [" ","Z"]) = [" "]
  // > findCommonItems([" ","Z"], ["Z"," "]) = ["Z"]
  (a, b) => {
    const commonItems = findCommonItems(a, b);
    const symmetricCommonItems = findCommonItems(b, a);
    expect(symmetricCommonItems).toHaveLength(commonItems.length);
  },
);

it.prop([fc.array(fc.char()), fc.array(fc.char())])(
  'should have at most the length of its inputs',
  (a, b) => {
    const commonItems = findCommonItems(a, b);
    expect(commonItems.length).toBeLessThanOrEqual(a.length);
    expect(commonItems.length).toBeLessThanOrEqual(b.length);
  },
);

it.prop([fc.array(fc.char()), fc.array(fc.char())])(
  'should have at most the same number of each character as its inputs',
  (a, b) => {
    const commonItems = findCommonItems(a, b);
    const commonCount = extractCount(commonItems);
    const aCount = extractCount(a);
    for (const [item, count] of commonCount) {
      const countOfItemInA = aCount.get(item) ?? 0;
      expect(countOfItemInA).toBeGreaterThanOrEqual(count);
    }
  },
);

it.prop([fc.array(fc.char()), fc.array(fc.char())])(
  'should be a subsequence of its inputs',
  (a, b) => {
    const commonItems = findCommonItems(a, b);
    expect(isSubsequenceOf(commonItems, a)).toBe(true);
    expect(isSubsequenceOf(commonItems, b)).toBe(true);
  },
);

it.prop([fc.array(fc.char()), fc.array(fc.char())])(
  'should be no-op when passing common items',
  (a, b) => {
    const commonItems = findCommonItems(a, b);
    expect(findCommonItems(a, commonItems)).toEqual(commonItems);
    expect(findCommonItems(commonItems, a)).toEqual(commonItems);
  },
);

it.prop([fc.array(fc.array(fc.char()))])(
  'should find the exact common items when one array is subarray of the other',
  data => {
    const allData = flatten(data); // [...data[0], ...data[1], ...data[2], ...data[3], ...]
    const partialData = flatten(data.filter((_, i) => i % 2 === 1)); // [...data[1], ...data[3], ...]
    const commonItems = findCommonItems(allData, partialData);
    // We have:
    // 1. commonItems contains at least all the items of partialData as they are in allData too
    // 2. commonItems cannot contain more items than its inputs (partialData for instance)
    expect(commonItems.length).toBeGreaterThanOrEqual(partialData.length);
  },
);
