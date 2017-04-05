const add = require('../add');

describe('CustomReporters', () => {
  test('adds fail', () => {
    expect(add(1, 3)).toBe(231);
    expect(add(5, 7)).toBe(120);
    expect(add(2, 4)).toBe(6);
  });
});
