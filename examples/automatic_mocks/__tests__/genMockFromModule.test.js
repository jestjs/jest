// Copyright 2004-present Facebook. All Rights Reserved.

//we need to disable automocking because is enabled on config in this example
jest.disableAutomock();

import utils from '../utilsMocked';

test('if exist additional implementation', () => {
  console.log(utils.isAuthorized.getMockImplementation.getMockImplementation);
  // expect(utils.authorized('wizzard')).toBeTruthy();
});

test('mocked implementation', () => {
  expect(utils.authorize._isMockFunction).toBe(true);
  expect(utils.isAuthorized._isMockFunction).toBe(true);
});
