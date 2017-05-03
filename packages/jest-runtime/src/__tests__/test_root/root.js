/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule root
 */

require('ExclusivelyManualMock');
require('ManuallyMocked');
require('ModuleWithSideEffects');
require('RegularModule');

// We only care about the static analysis, not about the runtime.
const lazyRequire = () => {
  require('image!not-really-a-module');
  require('cat.png');
  require('dog.png');
};

exports.jest = jest;
exports.lazyRequire = lazyRequire;
