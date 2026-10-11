/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('path');
const withDefault = require('./with-default.mjs');
exports.cacheMatchesRequire =
  require.cache[path.join(__dirname, 'with-default.mjs')].exports ===
  withDefault;
