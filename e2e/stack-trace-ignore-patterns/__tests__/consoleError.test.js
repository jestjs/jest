/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const callNoisyLib = require('../helpers/middle');

test('emits a console.error through a helper', () => {
  callNoisyLib();
});
