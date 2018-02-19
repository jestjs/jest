// Copyright 2004-present Facebook. All Rights Reserved.

import user from '../models/user';

jest.mock('../models/user');

test('if user model is mocked', () => {
  expect(user.getAuthenticated()).toEqual({age: 622, name: 'Mock name'});
});
