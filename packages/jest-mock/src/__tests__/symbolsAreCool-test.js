'use strict';
jest.enableAutomock();

test('Should work', () => {
  const symbol = require('../testAssets/symbolsAreCool');
  expect(symbol).not.toBe(undefined);
  expect(symbol).toBe(Symbol.for('Bowties.are.cool'));
});
