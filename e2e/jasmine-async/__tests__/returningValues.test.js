/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

describe('returning values', () => {
  for (const val of [
    1,
    'string',
    0.1,
    null,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    true,
    false,
    [1],
    {},
    () => {},
  ]) {
    it(`throws if '${val}:${typeof val}' is returned`, () => val);
  }
});
