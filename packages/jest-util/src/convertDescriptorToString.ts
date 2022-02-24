/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Global} from '@jest/types';

export default function convertDescriptorToString(
  descriptor: Global.BlockNameLike | undefined,
): string {
  switch (typeof descriptor) {
    case 'function':
      return descriptor.name;

    case 'number':
    case 'undefined':
      return `${descriptor}`;

    case 'string':
      return descriptor;
  }

  throw new Error('describe expects a class, function, number, or string.');
}
