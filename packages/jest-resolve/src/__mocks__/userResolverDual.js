/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

module.exports = {
  async: function userResolverAsync(path, options) {
    return Promise.resolve('module');
  },
  sync: function userResolverSync(path, options) {
    return 'module';
  },
};
