import each from './';

describe('array', () => {
  describe('.add', () => {
    each([
      [0, 0, 0],
      [0, 1, 1],
      [1, 1, 2],
    ]).test('returns the result of adding %s to %s', (a, b, expected) => {
      expect(a + b).toBe(expected);
    });
  });
});

describe('template', () => {
  describe('.add', () => {
    each`
      a    | b    | expected
      ${0} | ${0} | ${0}
      ${0} | ${1} | ${1}
      ${1} | ${1} | ${2}
    `.test('returns $expected when given $a and $b', ({ a, b, expected }) => {
      expect(a + b).toBe(expected);
    });
  });
});
