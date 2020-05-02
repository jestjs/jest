/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default function formatTime(
  time: number,
  prefixPower: number = -3,
  padLeftLength: number = 0,
): string {
  const prefixes = ['n', 'μ', 'm', ''];
  const prefixIndex = Math.max(
    0,
    Math.min(
      Math.trunc(prefixPower / 3) + prefixes.length - 1,
      prefixes.length - 1,
    ),
  );
  return `${String(time).padStart(padLeftLength)} ${prefixes[prefixIndex]}s`;
}
