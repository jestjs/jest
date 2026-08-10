/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const add = require('fakeModuleName');

describe('Custom Haste', () => {
  test('adds ok', () => {
    expect(true).toBe(true);
    expect(add(1, 2)).toBe(3);
  });
});
