/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Plain CJS without __esModule — default export should be the whole module.exports.
'use strict';

module.exports = {
  multiply(a, b) {
    return a * b;
  },
  value: 99,
};
