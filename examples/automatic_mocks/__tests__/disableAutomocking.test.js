// Copyright 2004-present Facebook. All Rights Reserved.

jest.disableAutomock();

import utils from '../utils';

test('replace implementation', () => {
  expect(utils.authorize()).toBe('token');
});
