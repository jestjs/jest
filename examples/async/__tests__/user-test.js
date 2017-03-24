// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

jest.mock('../request');

import * as user from '../user';

// The assertion for a promise must be returned.
it('works with promises', () => {
  return expect(user.getUserName(5)).resolves.toEqual('Paul');
});

// async/await can also be used.
it('works with async/await', async () => {
  await expect(user.getUserName(4)).resolves.toEqual('Mark');
});

// Testing for async errors can be done using `rejects`.
it('tests error with promises', () => {
  expect.assertions(1);
  return expect(user.getUserName(3)).rejects.toEqual({
    error: 'User with 3 not found.',
  });
});

// Or using async/await.
it('tests error with async/await', async () => {
  await expect(user.getUserName(2)).rejects.toEqual({
    error: 'User with 2 not found.',
  });
});
