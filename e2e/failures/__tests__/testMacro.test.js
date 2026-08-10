/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

const shouldEqual = require('../macros');

test('use some imported macro to make assertion', () => {
  shouldEqual(1, 2);
});
