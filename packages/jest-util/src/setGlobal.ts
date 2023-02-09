/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Global} from '@jest/types';

export default function setGlobal(
  globalToMutate: typeof globalThis | Global.Global,
  key: string,
  value: unknown,
): void {
  // @ts-expect-error: no index
  globalToMutate[key] = value;
}
