/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';

export const NODE_MODULES = `${path.sep}node_modules${path.sep}`;
export const DEFAULT_JS_PATTERN = '\\.[jt]sx?$';
export const PACKAGE_JSON = 'package.json';
export const JEST_CONFIG_BASE_NAME = 'jest.config';
export const JEST_CONFIG_EXT_CJS = '.cjs';
export const JEST_CONFIG_EXT_MJS = '.mjs';
export const JEST_CONFIG_EXT_JS = '.js';
export const JEST_CONFIG_EXT_TS = '.ts';
export const JEST_CONFIG_EXT_JSON = '.json';
export const JEST_CONFIG_EXT_ORDER = Object.freeze([
  JEST_CONFIG_EXT_JS,
  JEST_CONFIG_EXT_TS,
  JEST_CONFIG_EXT_MJS,
  JEST_CONFIG_EXT_CJS,
  JEST_CONFIG_EXT_JSON,
]);
