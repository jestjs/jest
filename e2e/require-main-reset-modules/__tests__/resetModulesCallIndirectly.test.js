/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  jest.resetModules();
});

test('require.main is set on requiring indirectly', () => {
  const {getMain} = require('../indirect.js');
  expect(getMain()).toBeTruthy();
});

test('require from main works on requiring indirectly', () => {
  const {requireFromMain} = require('../indirect.js');
  expect(requireFromMain('../package.json')).toBeTruthy();
});
