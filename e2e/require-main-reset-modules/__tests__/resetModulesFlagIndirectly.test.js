/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
test('require.main is set', () => {
  const {getMain} = require('../indirect.js');
  expect(getMain()).toBeTruthy();
});

test('require from main works', () => {
  const {requireFromMain} = require('../indirect.js');
  expect(requireFromMain('../package.json')).toBeTruthy();
});
