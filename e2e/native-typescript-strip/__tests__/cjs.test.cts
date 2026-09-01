const {expect, test} =
  require('@jest/globals') as typeof import('@jest/globals');
const {triple} = require('../triple.cts') as typeof import('../triple.cts');

test('strips types from a CJS test file', () => {
  const value: number = triple(14);
  expect(value).toBe(42);
});
