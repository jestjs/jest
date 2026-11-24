/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const dep = require('./automock-dep.mjs');

module.exports = {
  depIsMocked: dep.greet._isMockFunction === true,
  keys: Object.keys(require.cache),
};
