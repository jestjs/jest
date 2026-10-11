/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

test('should use the custom ES module resolver', () => {
  expect(require('bar')).toBe('bar');
});

test('should fall through to the default resolver', () => {
  expect(require('../foo')).toBeInstanceOf(Function);
});
