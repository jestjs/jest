/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// CJS module that require()s an .mjs dependency.
// Used to test requireModuleWithEsmPreload: the ESM dep must be preloaded
// before the sync require() is executed.
'use strict';
const esmModule = require('./esm-value.mjs');
module.exports = {esmValue: esmModule.value};
