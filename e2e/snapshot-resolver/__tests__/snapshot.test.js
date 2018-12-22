// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

test('snapshots are written to custom location', () => {
  expect('foobar').toMatchSnapshot();
});
