// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
const bar = require('./bar');

it('Bar transpiles', () => {
  expect(bar('test')).toBe('test');
});
