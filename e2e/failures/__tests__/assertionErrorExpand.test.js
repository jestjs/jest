/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const assert = require('assert');

test('wide object diff', () => {
  const shared = {};
  for (let index = 0; index < 12; index++) {
    shared[`key${index}`] = index;
  }

  assert.deepStrictEqual(
    {...shared, changed: 'received'},
    {...shared, changed: 'expected'},
  );
});
