/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

jest.mock('../');
const importedFn = require('../');
const mockFn = jest.fn(importedFn, 'myMockedFunction');

test('first test', () => {
  mockFn();
  expect(mockFn).toHaveBeenCalled();
  expect(mockFn.mock.calls.length).toBe(1);
});
