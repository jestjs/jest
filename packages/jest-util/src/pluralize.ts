/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default function pluralize(
  word: string,
  count: number,
  ending = 's',
): string {
  return `${count} ${word}${count === 1 ? '' : ending}`;
}
