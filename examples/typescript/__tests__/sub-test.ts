jest
  .dontMock('../sub')
  .dontMock('../sum')

describe('sub', () => {
  it('adds 5 - 1 to equal 4 in TypeScript', () => {
    var sum = require('../sub');
    expect(sum(5, 1)).toBe(4);
  });
});
