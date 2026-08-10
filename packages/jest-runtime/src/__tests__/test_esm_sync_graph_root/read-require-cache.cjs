/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  callRequireOnEntry: key => require.cache[key].require('whatever'),
  entry: key => require.cache[key],
  has: key => key in require.cache,
  keys: () => Object.keys(require.cache),
};
