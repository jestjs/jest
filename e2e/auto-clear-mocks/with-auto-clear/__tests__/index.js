/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

jest.mock('../');
const importedFn = require('../');
const localFn = jest.fn(() => 'abcd');

test('first test', () => {
  importedFn();
  expect(localFn()).toBe('abcd');

  expect(importedFn.mock.calls.length).toBe(1);
  expect(localFn.mock.calls.length).toBe(1);
});

test('second test', () => {
  importedFn();
  expect(localFn()).toBe('abcd');

  expect(importedFn.mock.calls.length).toBe(1);
  expect(localFn.mock.calls.length).toBe(1);
});
