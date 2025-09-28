/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// this is a separate file so it can be mocked in tests
export {
  loadPartialConfigAsync,
  transformSync,
  transformAsync,
} from '@babel/core';

import {
  loadPartialConfig,
  // @ts-expect-error -- Wrong @types/babel__core definition
  loadPartialConfigSync,
} from '@babel/core';

// Old babel 7 versions didn't have loadPartialConfigSync
const _loadPartialConfigSync: typeof loadPartialConfig =
  loadPartialConfigSync ?? loadPartialConfig;
export {_loadPartialConfigSync as loadPartialConfigSync};
