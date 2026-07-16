/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {fileURLToPath} from 'url';
import {createTransformer} from 'babel-jest';

export default {
  ...createTransformer({
    presets: ['@babel/preset-flow'],
    root: fileURLToPath(import.meta.url),
  }),
  // remove the synchronous functions
  getCacheKey: undefined,
  process: undefined,
};
