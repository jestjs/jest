/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Prando from 'prando';

export const rngBuilder: (seed: number) => {next: () => number} = (
  seed: number,
) => new Prando(seed);

// Fisher-Yates shuffle
// This is performed in-place
export default function shuffleArray<T>(
  array: Array<T>,
  random: () => number = Math.random,
): Array<T> {
  const length = array == null ? 0 : array.length;
  if (!length) {
    return [];
  }
  let index = -1;
  const lastIndex = length - 1;
  while (++index < length) {
    const rand = index + Math.floor(random() * (lastIndex - index + 1));
    const value = array[index];
    array[index] = array[rand];
    array[rand] = value;
  }
  return array;
}
