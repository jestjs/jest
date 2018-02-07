// @flow

'use strict';

const skipOnWindows = require('../../scripts/skip_on_windows');
const runJest = require('../runJest');

skipOnWindows.suite();

it('should transform linked modules', () => {
  const result = runJest.json('transform-linked-modules', ['--no-cache']).json;

  expect(result.success).toBe(true);
  expect(result.numTotalTests).toBe(2);
});
