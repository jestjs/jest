// @flow

'use strict';

const SkipOnWindows = require('../../scripts/SkipOnWindows');
const runJest = require('../runJest');

SkipOnWindows.suite();

it('should transform linked modules', () => {
  const result = runJest.json('transform-linked-modules', ['--no-cache']).json;

  expect(result.success).toBe(true);
  expect(result.numTotalTests).toBe(2);
});
