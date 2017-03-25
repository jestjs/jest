// Copyright 2004-present Facebook. All Rights Reserved.

jest.mock('../native');
const native = require('../native');

test('mock works with native async', () => {
  expect(native.asyncMethod).toBeDefined();
  expect(native.syncMethod).toBeDefined();
});
