/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {xoroshiro128plus, unsafeUniformIntDistribution} from 'pure-rand';

// Generates [from, to] inclusive
export type RandomNumberGenerator = {next: (from: number, to: number) => number};

// Will likely fail if there are more than 2**32 items to randomize
export const rngBuilder: (seed: number) => RandomNumberGenerator = (
  seed: number,
) => {
  const gen = xoroshiro128plus(seed);
  return {next: (from, to) => unsafeUniformIntDistribution(from, to, gen)};
};

// Fisher-Yates shuffle
// This is performed in-place
export default function shuffleArray<T>(
  array: Array<T>,
  random: RandomNumberGenerator,
): Array<T> {
  const length = array == null ? 0 : array.length;

  if (!length) {
    return [];
  }
  let index = -1;
  const lastIndex = length - 1;
  while (++index < length) {
    const n = random.next(index, lastIndex);
    const value = array[index];
    array[index] = array[n];
    array[n] = value;
  }
  return array;
}
