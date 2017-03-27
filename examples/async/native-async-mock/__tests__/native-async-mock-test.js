// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

jest.mock('../native', () => ({
  asyncMethod: () => Promise.resolve('test'),
}));

const native = require('../native');

test('mock works with native async', async () => {
  expect(native.asyncMethod).toBeDefined();
  await expect(native.asyncMethod()).resolves.toBe('test');
});
