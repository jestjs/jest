// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

jest.mock('../request');

import * as user from '../user';

// The promise that is being tested should be returned.
it('works with promises', () => {
  return user.getUserName(5).then(name => expect(name).toEqual('Paul'));
});

// async/await can also be used.
it('works with async/await', async () => {
  const userName = await user.getUserName(4);
  expect(userName).toEqual('Mark');
});

// Testing for async errors can be done using `catch`.
it('tests error with promises', () => {
  expect.assertions(1);
  return user.getUserName(3).catch(e =>
    expect(e).toEqual({
      error: 'User with 3 not found.',
    })
  );
});

// Or try-catch.
it('tests error with async/await', async () => {
  expect.assertions(1);
  try {
    await user.getUserName(2);
  } catch (object) {
    expect(object.error).toEqual('User with 2 not found.');
  }
});
