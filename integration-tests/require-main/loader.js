/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const path = require('path');

module.exports = function load(moduleId) {
  return require(path.join(path.dirname(require.main.filename), moduleId));
};
