// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

import sum from '../sum';

it('adds 1 + 2 to equal 3 in TScript', () => {
  expect(sum(1, 2)).toBe(3);
});

it('adds 1 + 2 to equal 3 in JavaScript', () => {
  const sumJs = require('../sum.js');
  expect(sumJs(1, 2)).toBe(3);
});
