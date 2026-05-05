/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Simulates a CJS file emitted by Babel from an ES module source.
// The __esModule sentinel tells importers that .default is the real default.
'use strict';
Object.defineProperty(exports, '__esModule', {value: true});
exports.default = 42;
exports.named = 'hello';
