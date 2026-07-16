// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

'use strict';

jest.mock('../request');

import * as user from '../user';

// Testing promise can be done using `.resolves`.
it('works with resolves', () => {
  expect.assertions(1);
  return expect(user.getUserName(5)).resolves.toBe('Paul');
});

// The assertion for a promise must be returned.
it('works with promises', () => {
  expect.assertions(1);
  return user.getUserName(4).then(data => expect(data).toBe('Mark'));
});

// async/await can be used.
it('works with async/await', async () => {
  expect.assertions(1);
  const data = await user.getUserName(4);
  expect(data).toBe('Mark');
});

// async/await can also be used with `.resolves`.
it('works with async/await and resolves', async () => {
  expect.assertions(1);
  await expect(user.getUserName(5)).resolves.toBe('Paul');
});

// Testing for async errors using `.rejects`.
it('tests error with rejects', () => {
  expect.assertions(1);
  return expect(user.getUserName(3)).rejects.toEqual({
    error: 'User with 3 not found.',
  });
});

// Testing for async errors using Promise.catch.
test('tests error with promises', async () => {
  expect.assertions(1);
  return user.getUserName(2).catch(error =>
    expect(error).toEqual({
      error: 'User with 2 not found.',
    }),
  );
});

// Or using async/await.
it('tests error with async/await', async () => {
  expect.assertions(1);
  try {
    await user.getUserName(1);
  } catch (error) {
    expect(error).toEqual({
      error: 'User with 1 not found.',
    });
  }
});

// Or using async/await with `.rejects`.
it('tests error with async/await and rejects', async () => {
  expect.assertions(1);
  await expect(user.getUserName(3)).rejects.toEqual({
    error: 'User with 3 not found.',
  });
});
