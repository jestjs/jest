/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {fromB} from './automock-cycle-b.mjs';

export const fromA = 'a';
export function readB() {
  return fromB;
}
