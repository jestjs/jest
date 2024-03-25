/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function normalizeIcons(str: string): string {
  if (!str) {
    return str;
  }

  // Make sure to keep in sync with `jest-util/src/specialChars`
  return str
    .replaceAll(new RegExp('\u00D7', 'gu'), '\u2715')
    .replaceAll(new RegExp('\u221A', 'gu'), '\u2713');
}
