// @flow

'use strict';

const runJest = require('../runJest');

it('should transform linked modules', () => {
  const result = runJest.json('transform-linked-modules', ['--no-cache']).json;

  expect(result.success).toBe(true);
  expect(result.numTotalTests).toBe(2);
});
