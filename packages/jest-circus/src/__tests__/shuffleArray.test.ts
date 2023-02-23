/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import shuffleArray, {rngBuilder} from '../shuffleArray';

describe('rngBuilder', () => {
  // Breaking these orders would be a breaking change
  // Some people will be using seeds relying on a particular order
  test.each([1, 2, 4, 8, 16])('creates a randomizer given seed %s', seed => {
    const rng = rngBuilder(seed);
    const results = Array(10)
      .fill(0)
      .map(() => rng.next(0, 10));
    expect(results).toMatchSnapshot();
  });
});

describe('shuffleArray', () => {
  test('empty array is shuffled', () => {
    const shuffled = shuffleArray([], rngBuilder(seed));
    expect(shuffled).toEqual([]);
  });

  // Breaking these orders would be a breaking change
  // Some people will be using seeds relying on a particular order
  const seed = 321;
  test.each([[['a']], [['a', 'b']], [['a', 'b', 'c']], [['a', 'b', 'c', 'd']]])(
    'shuffles list %p',
    l => {
      expect(shuffleArray(l, rngBuilder(seed))).toMatchSnapshot();
    },
  );
});
