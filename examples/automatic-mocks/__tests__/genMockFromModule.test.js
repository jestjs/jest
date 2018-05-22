// Copyright 2004-present Facebook. All Rights Reserved.

import utils from '../utils';

test('implementation created by automock', () => {
  expect(utils.authorize('wizzard')).toBeUndefined();
  expect(utils.isAuthorized()).toBeUndefined();
});

test('implementation created by jest.genMockFromModule', () => {
  const utils = jest.genMockFromModule('../utils').default;
  utils.isAuthorized = jest.fn(secret => secret === 'not wizard');

  expect(utils.authorize.mock).toBeTruthy();
  expect(utils.isAuthorized('not wizard')).toEqual(true);
});
