/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Stateful CJS module — used to verify that two ESM importers share the same instance.
'use strict';
let callCount = 0;
exports.increment = function increment() {
  callCount += 1;
};
exports.getCount = function getCount() {
  return callCount;
};
