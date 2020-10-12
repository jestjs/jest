/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
test('require.main is set', () => {
  const {getMain} = require('../index.js');
  expect(getMain()).toBeTruthy();
});

test('require from main works', () => {
  const {requireFromMain} = require('../index.js');
  expect(requireFromMain('../package.json')).toBeTruthy();
});
