/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');

export default function colorize(
  str: string,
  start: number,
  end: number,
): string {
  return (
    chalk.dim(str.slice(0, start)) +
    chalk.reset(str.slice(start, end)) +
    chalk.dim(str.slice(end))
  );
}
