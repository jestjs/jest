/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RegularModule
 */

'use strict';

// For some reason thinks it's a strict violation.
if (exports !== this) {
  throw new Error('Invalid module context');
}

let moduleStateValue = 'default';

function setModuleStateValue(value) {
  moduleStateValue = value;
}

function getModuleStateValue() {
  return moduleStateValue;
}

(() => {
  // Make sure ModuleWithSideEffects is part of the module map for
  // RegularModule.
  require('ModuleWithSideEffects');
});

exports.getModuleStateValue = getModuleStateValue;
exports.isRealModule = true;
exports.setModuleStateValue = setModuleStateValue;
exports.parent = module.parent;
exports.paths = module.paths;
exports.filename = module.filename;
exports.jest = jest;
exports.object = {};
