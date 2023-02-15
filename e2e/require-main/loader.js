/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as path from 'path';

module.exports = function load(moduleId) {
  return require(path.join(path.dirname(require.main.filename), moduleId));
};
