// Copyright 2004-present Facebook. All Rights Reserved.

'use strict';

jest.unmock('../user');

import * as user from '../user';

describe('async tests', () => {
  // Use `pit` instead of `it` for testing promises.
  // The promise that is being tested should be returned.
  pit('works with promises', () => {
    return user.getUserName(5)
      .then(name => expect(name).toEqual('Paul'));
  });

  pit('works with async/await', async () => {
    const userName = await user.getUserName(4);
    expect(userName).toEqual('Mark');
  });
});
