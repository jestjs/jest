// Copyright 2004-present Facebook. All Rights Reserved.

import user from '../models/user';

jest.mock('../models/user');

test('without mocked module', () => {
  expect(user.getAuthenticated()).toEqual({age: 622, name: 'Mock name'});
});
