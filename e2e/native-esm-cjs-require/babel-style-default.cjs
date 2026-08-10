/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Simulates a CJS file emitted by Babel/Webpack from an ESM source.
// The __esModule flag signals that `.default` is the real default export.
'use strict';
Object.defineProperty(exports, '__esModule', {value: true});
exports.default = function greet(name) {
  return `Hello, ${name}!`;
};
exports.helper = function helper(x) {
  return x * 2;
};
