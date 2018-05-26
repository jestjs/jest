import each from '../../src';

describe('it', () => {
  describe('.add', () => {
    const add = (a, b) => a + b;
    each([
      [1, 2, 3],
      [2, 1, 3],
      [1000, 1, 1001]
    ]).it('returns the result of adding %s to %s', (a, b, expected) => {
      expect(add(a, b)).toBe(expected);
    });
  });

  describe('true', () => {
    each([
      [true],
      [true],
      [true]
    ]).it.only('will pass %s', (bool) => {
      expect(bool).toBe(true);
    });
  });

  describe('only wit .fit', () => {
    each([
      [true],
      [true],
      [true]
    ]).fit('will pass %s', (bool) => {
      expect(bool).toBe(true);
    });
  });

  describe('whatevz', () => {
    each([
      [':('],
      ['run'],
      ['me']
    ]).it.skip('will never run this test %s', (str) => {
      expect(str).toBe('');
    });
  });

  describe('whatevz ❌👞', () => {
    each([
      [':('],
      ['run'],
      ['me']
    ]).xit('will never run this test %s', (str) => {
      expect(str).toBe('');
    });
  });
});
