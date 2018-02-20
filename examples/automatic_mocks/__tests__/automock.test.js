// Copyright 2004-present Facebook. All Rights Reserved.

import utils from '../utils';

test('if utils mocked', () => {
  expect(utils.authorize._isMockFunction).toBeTruthy();
  expect(utils.isAuthorized._isMockFunction).toBeTruthy();
});

test('replace implementation', () => {
  utils.authorize.mockReturnValue('mocked_token');
  utils.isAuthorized.mockReturnValue(true);

  expect(utils.authorize()).toBe('mocked_token');
  expect(utils.isAuthorized('not_wizard')).toBeTruthy();
});
