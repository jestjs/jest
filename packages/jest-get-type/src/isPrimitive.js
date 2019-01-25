/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import getType from './getType';

const PRIMITIVES = new Set([
  'string',
  'number',
  'boolean',
  'null',
  'undefined',
  'symbol',
]);

export default (value: any): boolean => PRIMITIVES.has(getType(value));
