import each from '../../src';

each([
  [1, 0, 1],
  [0, 1, 1],
  [1, 1, 2],
  [1, 2, 3],
  [2, 1, 3],
]).describe('.add(%s, %s)', (a, b, expected) => {
  test(`returns ${expected}`, () => {
    expect(add(a, b)).toBe(expected);
  });
});
