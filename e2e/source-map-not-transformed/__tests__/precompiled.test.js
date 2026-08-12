/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const {boom} = require('../lib/boom.js');

test('maps a frame in a file Jest did not transform', () => {
  boom();
});
