/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable local/ban-types-eventually */

export function difference(a: number, b: number): number {
  const branch1: boolean = true ? 1 : 0;
  const branch2: boolean = true ? 1 : 0;
  const branch3: boolean = true || true || false;
  const fn: Function = true ? () => null : () => null;

  return a - b;
}
