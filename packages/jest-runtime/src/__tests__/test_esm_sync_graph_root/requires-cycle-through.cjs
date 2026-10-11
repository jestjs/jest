/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

let observed;
try {
  require('./nested-cycle-back.mjs');
} catch (error) {
  observed = error.code;
}
exports.observed = observed;
