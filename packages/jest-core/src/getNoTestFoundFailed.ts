/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');

export default function getNoTestFoundFailed() {
  return (
    chalk.bold('No failed test found.\n') +
    chalk.dim('Press `f` to quit "only failed tests" mode.')
  );
}
