/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import pc = require('picocolors');

export default function colorize(
  str: string,
  start: number,
  end: number,
): string {
  return (
    pc.dim(str.slice(0, start)) +
    pc.reset(str.slice(start, end)) +
    pc.dim(str.slice(end))
  );
}
