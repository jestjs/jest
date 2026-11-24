/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// An ES module resolver whose default export is a `sync`/`async` object.
module.exports = {
  __esModule: true,
  default: {
    async: function userResolverAsync(path, options) {
      return Promise.resolve('module');
    },
  },
};
