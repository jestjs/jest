import each from '../../src';

describe('test', () => {
  describe('.add', () => {
    const add = (a, b) => a + b;
    each([
      [1, 2, 3],
      [2, 1, 3],
      [1000, 1, 1001]
    ]).test('returns the result of adding %s to %s', (a, b, expected) => {
      expect(add(a, b)).toBe(expected);
    });
  });

  describe('true', () => {
    each([
      [true],
      [true],
      [true]
    ]).test.only('will pass %s', (bool) => {
      expect(bool).toBe(true);
    });
  });

  describe('whatevz', () => {
    each([
      [':('],
      ['run'],
      ['me']
    ]).test.skip('will never run this test %s', (str) => {
      expect(str).toBe('');
    });
  });

  describe('whatevz ❌👞', () => {
    each([
      [':('],
      ['run'],
      ['me']
    ]).xtest('will never run this test %s', (str) => {
      expect(str).toBe('');
    });
  });
});
