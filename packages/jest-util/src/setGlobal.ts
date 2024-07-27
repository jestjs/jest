/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Global} from '@jest/types';
import {isShreddable, setNotShreddable} from './shredder';

export default function setGlobal(
  globalToMutate: typeof globalThis | Global.Global,
  key: string | symbol,
  value: unknown,
  shredAfterTeardown = true,
): void {
  Reflect.set(globalToMutate, key, value);
  if (!shredAfterTeardown && isShreddable(value)) {
    setNotShreddable(value);
  }
}
