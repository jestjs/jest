const foo = Symbol('foo');
const bar = Symbol('bar');
const obj = {[foo]: 'foo'};

it('symbol: objectNotContaining should pass', () => {
  expect(obj).toEqual(expect.not.objectContaining({[bar]: 'bar'}));
});
