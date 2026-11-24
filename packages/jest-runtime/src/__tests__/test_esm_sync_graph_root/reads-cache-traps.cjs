/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('path');

const esmPath = path.join(__dirname, 'with-default.mjs');
require(esmPath);

module.exports = {
  entryExports: require.cache[esmPath] && require.cache[esmPath].exports,
  hasEntry: esmPath in require.cache,
  listed: Object.keys(require.cache).includes(esmPath),
  selfEntry: require.cache[module.filename],
  selfHasEntry: module.filename in require.cache,
  selfListed: Object.keys(require.cache).includes(module.filename),
};
