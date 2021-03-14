/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {fileURLToPath} from 'url';
import babelJest from 'babel-jest';

export default {
  ...babelJest.default.createTransformer({
    presets: ['@babel/preset-flow'],
    root: fileURLToPath(import.meta.url),
  }),
  // remove the synchronous functions
  getCacheKey: undefined,
  process: undefined,
};
