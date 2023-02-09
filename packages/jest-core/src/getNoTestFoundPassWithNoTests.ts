/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');

export default function getNoTestFoundPassWithNoTests(): string {
  return chalk.bold('No tests found, exiting with code 0');
}
