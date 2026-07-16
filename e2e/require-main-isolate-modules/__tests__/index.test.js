/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
let foo;

jest.isolateModules(() => (foo = require('../index')));

test('`require.main` on using `jest.isolateModules` should not be undefined', () => {
  expect(foo()).toBe(1);
});
