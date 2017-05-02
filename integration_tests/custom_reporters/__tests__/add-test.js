/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

const add = require('../add');

describe('Custom Reporters', () => {
  test('adds ok', () => {
    expect(add(1, 2)).toBe(3);
    expect(add(3, 4)).toBe(7);
    expect(add(12, 24)).toBe(36);
  });
});
