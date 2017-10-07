/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

jest.mock('../');
const importedFn = require('../');
// empty mock name should result in default 'jest.fn()' output
const mockFn = jest.fn(importedFn, '');

test('first test', () => {
  mockFn();
  expect(mockFn).toHaveBeenCalledTimes(1);
});
