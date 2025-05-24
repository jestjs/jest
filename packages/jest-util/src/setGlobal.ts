/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Global} from '@jest/types';
import {
  canDeleteProperties,
  protectProperties,
} from './garbage-collection-utils';

export default function setGlobal(
  globalToMutate: typeof globalThis | Global.Global,
  key: string | symbol,
  value: unknown,
  afterTeardown: 'clean' | 'retain' = 'clean',
): void {
  Reflect.set(globalToMutate, key, value);
  if (afterTeardown === 'retain' && canDeleteProperties(value)) {
    protectProperties(value);
  }
}
