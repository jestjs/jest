/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

describe('returning values', () => {
  [
    1,
    'string',
    0.1,
    null,
    NaN,
    Infinity,
    true,
    false,
    [1],
    {},
    () => {},
  ].forEach(val => {
    it(`throws if '${val}:${typeof val}' is returned`, () => {
      return val;
    });
  });
});
