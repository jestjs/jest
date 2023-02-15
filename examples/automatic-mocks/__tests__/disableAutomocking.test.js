// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

import utils from '../utils';

jest.disableAutomock();

test('original implementation', () => {
  expect(utils.authorize()).toBe('token');
});
