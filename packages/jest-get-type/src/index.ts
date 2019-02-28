/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import getTypeFunc from './getType';
import isPrimitive from './isPrimitive';

function getType(value: unknown) {
  return getTypeFunc(value);
}

getType.isPrimitive = isPrimitive;

export = getType;
