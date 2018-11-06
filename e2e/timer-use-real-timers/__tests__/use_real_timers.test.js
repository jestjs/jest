// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

jest.useRealTimers();

test('bar', () => {
  jest.runAllTimers();
});
