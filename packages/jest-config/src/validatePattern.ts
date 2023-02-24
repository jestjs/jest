/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default function validatePattern(pattern?: string): boolean {
  if (pattern) {
    try {
      // eslint-disable-next-line no-new
      new RegExp(pattern, 'i');
    } catch {
      return false;
    }
  }

  return true;
}
