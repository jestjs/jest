/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {unsafeUniformIntDistribution, xoroshiro128plus} from 'pure-rand';

// Generates [from, to] inclusive
export type RandomNumberGenerator = {
  next: (from: number, to: number) => number;
};

export const rngBuilder = (seed: number): RandomNumberGenerator => {
  const gen = xoroshiro128plus(seed);
  return {next: (from, to) => unsafeUniformIntDistribution(from, to, gen)};
};

// Fisher-Yates shuffle
// This is performed in-place
export default function shuffleArray<T>(
  array: Array<T>,
  random: RandomNumberGenerator,
): Array<T> {
  const length = array.length;
  if (length === 0) {
    return [];
  }

  for (let i = 0; i < length; i++) {
    const n = random.next(i, length - 1);
    const value = array[i];
    array[i] = array[n];
    array[n] = value;
  }

  return array;
}
