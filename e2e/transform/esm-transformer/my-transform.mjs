/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createRequire} from 'module';

const require = createRequire(import.meta.url);

const fileToTransform = require.resolve('./module');

export default {
  process(src, filepath) {
    if (filepath === fileToTransform) {
      return 'module.exports = 42;';
    }

    return src;
  },
};
