// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

import utils from '../utils';

test('if utils are mocked', () => {
  expect(utils.authorize.mock).toBeTruthy();
  expect(utils.isAuthorized.mock).toBeTruthy();
});

test('mocked implementation', () => {
  utils.authorize.mockReturnValue('mocked_token');
  utils.isAuthorized.mockReturnValue(true);

  expect(utils.authorize()).toBe('mocked_token');
  expect(utils.isAuthorized('not_wizard')).toBeTruthy();
});
