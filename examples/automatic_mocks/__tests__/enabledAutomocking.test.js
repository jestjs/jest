// Copyright 2004-present Facebook. All Rights Reserved.

// we need to disable automocking becouse of jest configuration in this example
jest.disableAutomock();

// Nowe we enabling automocking
jest.enableAutomock();

import utils from '../utils';

test('mocked implementation', () => {
  expect(utils.authorize._isMockFunction).toBeTruthy();
  expect(utils.isAuthorized._isMockFunction).toBeTruthy();
});
