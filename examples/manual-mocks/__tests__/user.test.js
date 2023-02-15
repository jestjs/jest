// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

import user from '../models/user';

test('if original user model', () => {
  expect(user.getAuthenticated()).toEqual({age: 26, name: 'Real name'});
});
