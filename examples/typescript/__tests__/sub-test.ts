jest
  .unmock('../sub')
  .unmock('../sum')

describe('sub', () => {
  it('adds 5 - 1 to equal 4 in TypeScript', () => {
    const sum = require('../sub');
    expect(sum(5, 1)).toBe(4);
  });
});
