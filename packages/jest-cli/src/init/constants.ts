/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const PACKAGE_JSON = 'package.json';
export const JEST_CONFIG_BASE_NAME = 'jest.config';
export const JEST_CONFIG_EXT_CJS = '.cjs';
export const JEST_CONFIG_EXT_JS = '.js';
export const JEST_CONFIG_EXT_JSON = '.json';
export const JEST_CONFIG_EXT_ORDER = Object.freeze([
  JEST_CONFIG_EXT_JS,
  JEST_CONFIG_EXT_CJS,
  JEST_CONFIG_EXT_JSON,
]);
