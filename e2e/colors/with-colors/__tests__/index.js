/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const TestClass = require('..');
const localClass = new TestClass();

test('first test', () => {
  expect(localClass.test).toHaveBeenCalledTimes(1);
});

test('second test', () => {
  expect(localClass.test()).toBe('12345');
});
