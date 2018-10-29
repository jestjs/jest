// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

test('normal file', () => {
  const normal = require('../ignored/normal');
  expect(normal).toEqual('ignored/normal');
});

test('symlink', () => {
  const symlink = require('../ignored/symlink');
  expect(symlink).toEqual('transformed');
});
