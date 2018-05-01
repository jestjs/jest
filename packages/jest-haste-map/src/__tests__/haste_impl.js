/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

module.exports = {
  getHasteName(path) {
    if (
      path.includes('__mocks__') ||
      path.includes('NoHaste') ||
      path.includes('/module_dir/') ||
      path.includes('/sourcemaps/')
    ) {
      return undefined;
    }

    return path
      .substr(path.lastIndexOf('/') + 1)
      .replace(/(\.(android|ios|native))?\.js$/, '');
  },
};
