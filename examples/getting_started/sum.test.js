// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

test('adds 1 + 2 to equal 3', () => {
  const sum = require('./sum');
  expect(sum(1, 2)).toBe(3);
});
