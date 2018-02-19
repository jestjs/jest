// Copyright 2004-present Facebook. All Rights Reserved.

import user from '../../models/user';

test('without mocked module', () => {
  expect(user.getAuthenticated()).toEqual({age: 26, name: 'Real name'});
});
