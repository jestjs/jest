jest
  .dontMock('../sum.ts')
  .dontMock('../sum.js')

describe('sum', () => {
  it('adds 1 + 2 to equal 3 in TScript', ()=> {
    var sum = require('../sum.ts');
    expect(sum(1, 2)).toBe(3);
  });

  it('adds 1 + 2 to equal 3 in JavaScript', ()=> {
    var sum = require('../sum.js');
    expect(sum(1, 2)).toBe(3);
  });
});
