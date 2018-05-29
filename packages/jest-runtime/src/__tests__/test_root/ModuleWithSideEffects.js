/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ModuleWithSideEffects
 */

'use strict';

const RegularModule = require('RegularModule');

RegularModule.setModuleStateValue('Side effect value');

exports.fn = () => '42';
