/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const fileToTransform = require.resolve('./index.js');

module.exports = {
  process(src, filename) {
    if (filename === fileToTransform) {
      return {code: src.replace('hello', 'hello, world')};
    }

    return {code: src};
  },
};
