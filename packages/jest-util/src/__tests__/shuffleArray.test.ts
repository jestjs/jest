import shuffleArray, {rngBuilder} from '../shuffleArray';

describe(rngBuilder, () => {
  // Breaking these orders would be a breaking change
  // Some people will be using seeds relying on a particular order
  test.each([
    [1, ['0.50', '0.52', '0.92', '0.32']], // 0 is not a valid seed
    [2, ['0.50', '0.53', '0.66', '0.89']],
    [4, ['0.50', '0.56', '0.82', '0.28']],
    [8, ['0.50', '0.63', '0.15', '0.06']],
    [16, ['0.50', '0.75', '0.29', '0.39']],
  ])('creates a randomiser given seed %s', (seed, expectations) => {
    const newRng = rngBuilder(seed);
    for (const expectedNext of expectations) {
      expect(newRng.next().toFixed(2)).toEqual(expectedNext);
    }
  });
});

describe(shuffleArray, () => {
  it('empty array is shuffled', () => {
    const shuffled = shuffleArray([]);
    expect(shuffled).toEqual([]);
  });

  // Breaking these orders would be a breaking change
  // Some people will be using seeds relying on a particular order
  const seed = 123;
  test.each([
    [
      ['a', 'b'],
      ['b', 'a'],
    ],
    [
      ['a', 'b', 'c'],
      ['b', 'a', 'c'],
    ],
    [
      ['a', 'b', 'c', 'd'],
      ['c', 'a', 'd', 'b'],
    ],
  ])('shuffles list %p', (l, expectation) => {
    const rng = rngBuilder(seed);
    expect(shuffleArray(l, () => rng.next())).toEqual(expectation);
  });
});
