/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const fileToTransform = require.resolve('./module-under-test');

module.exports = {
  async processAsync(src, filepath) {
    if (filepath !== fileToTransform) {
      throw new Error(`Unsupported filepath ${filepath}`);
    }

    return 'export default 42;';
  },
};
