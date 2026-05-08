/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Simulates a CJS module like tslib that sets __esModule but exports named
// helpers directly on exports, with no .default property.
'use strict';
Object.defineProperty(exports, '__esModule', {value: true});
exports.helper = function helper(x) {
  return x * 2;
};
exports.value = 99;
