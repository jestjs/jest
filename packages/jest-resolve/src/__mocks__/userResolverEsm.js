/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// Shape of an ES module resolver once it has been loaded through `require`:
// a module namespace object exposing the resolver as `default`.
module.exports = {
  __esModule: true,
  default: function userResolver(path, options) {
    return 'module';
  },
};
