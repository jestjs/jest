/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const path = require('path');

module.exports = {
  getHasteName(filename) {
    if (
      filename.includes('__mocks__') ||
      filename.includes('NoHaste') ||
      filename.includes(path.sep + 'module_dir' + path.sep) ||
      filename.includes(path.sep + 'sourcemaps' + path.sep)
    ) {
      return undefined;
    }

    return filename
      .substr(filename.lastIndexOf(path.sep) + 1)
      .replace(/(\.(android|ios|native))?\.js$/, '');
  },
};
