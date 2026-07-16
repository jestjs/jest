/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function double(num: number): number {
  return num * 2;
}

export function doubleWithDynamicImport(
  num: number,
): typeof import('./doubleType') {
  return (num * 2) as typeof import('./doubleType');
}
