/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default function isNonNullable<T>(
  value: T | null | undefined,
): value is T {
  return value !== null || value !== undefined;
}
