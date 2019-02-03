// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
const foo = require('./foo');

it('Foo transpiles', () => {
  expect(foo('test')).toBe('test');
});
