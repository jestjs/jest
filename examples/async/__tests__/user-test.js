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

  // Async error test do not use traditional jasmine toThrow().
  // Instead, they can be processed with standard javascript style.
  pit('tests error with promises', () => {
    return user.getUserName(3)
      .catch(e => expect(e).toEqual({
        error: 'Do not have userID 3',
      }));
  });

  pit('tests error with async/await', async () => {
    try {
      await user.getUserName(2);
    } catch (e) {
      expect(e).toEqual({
        error: 'Do not have userID 2',
      });
    }
  });
});
