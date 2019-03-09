const lib = require('foo');

it('should work', () => {
  expect(process.versions.pnp).toBeTruthy();
  expect(lib()).toEqual(42);
});
