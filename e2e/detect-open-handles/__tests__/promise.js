// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

test('something', () => {
  // eslint-disable-next-line no-new
  new Promise(() => {});
  expect(true).toBe(true);
});
