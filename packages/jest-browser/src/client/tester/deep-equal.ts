/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {equals, iterableEquality} from '@jest/expect-utils';

export function deepEqual(left: unknown, right: unknown): boolean {
  return equals(left, right, [iterableEquality], true);
}
