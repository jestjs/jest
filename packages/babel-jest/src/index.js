/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const babel = require('babel-core');
const jestPreset = require('babel-preset-jest');

const createTransformer = options => {
  options = Object.assign({}, options, {
    auxiliaryCommentBefore: ' istanbul ignore next ',
    presets: [jestPreset],
    retainLines: true,
  });
  delete options.cacheDirectory;

  return {
    process(src, filename) {
      if (babel.util.canCompile(filename)) {
        return babel.transform(
          src,
          Object.assign({}, options, {filename}),
        ).code;
      }
      return src;
    },
  };
};

module.exports = createTransformer();
module.exports.createTransformer = createTransformer;
