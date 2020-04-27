/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const path = require.resolve('./create_require_module', {outsideJestVm: true});
if (typeof path !== 'string') {
  throw new Error('require.resolve not spec-compliant: must return a string');
}
module.exports = require(path);
