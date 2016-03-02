/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const babel = require('babel-core');
const jestPreset = require('babel-preset-jest');
const path = require('path');

const NODE_MODULES = path.sep + 'node_modules' + path.sep;

module.exports = {
  process(src, filename) {
    if (!filename.includes(NODE_MODULES) && babel.util.canCompile(filename)) {
      return babel.transform(src, {
        filename,
        presets: [jestPreset],
        retainLines: true,
      }).code;
    }
    return src;
  },
};
