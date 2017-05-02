// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

jest.mock('../request');

import * as user from '../user';

// Testing promise can be done using `.resolves`.
it('works with promises', () => {
  expect.assertions(1);
  return expect(user.getUserName(5)).resolves.toEqual('Paul');
});

// The assertion for a promise must be returned.
it('works with promises', () => {
  expect.assertions(1);
  return user.getUserName(4).then(data =>
    expect(data).toEqual('Mark')
  );
});

// async/await can also be used.
it('works with async/await', async () => {
  expect.assertions(1);
  await expect(user.getUserName(5)).resolves.toEqual('Paul');
});

// Testing for async errors can be done using `.rejects`.
it('tests error with rejects', () => {
  expect.assertions(1);
  return expect(user.getUserName(3)).rejects.toEqual({
    error: 'User with 3 not found.',
  });
});

// Or using Promise.catch.
test('tests error with promises', async () => {
  expect.assertions(1);
  return user.getUserName(2).catch(e =>
    expect(e).toEqual({
      error: 'User with 2 not found.',
    })
  );
});

// Or using async/await.
it('tests error with async/await', async () => {
  expect.assertions(1);
  try {
    await user.getUserName(1);
  } catch (e) {
    expect(e).toEqual({
      error: 'User with 1 not found.',
    });
  }
});
