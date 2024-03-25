/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import type {Config} from '@jest/types';

export default function printDisplayName(config: Config.ProjectConfig): string {
  const {displayName} = config;
  const white = chalk.reset.inverse.white;
  if (!displayName) {
    return '';
  }

  const {name, color} = displayName;
  const chosenColor = chalk.reset.inverse[color] ?? white;
  return chalk.supportsColor ? chosenColor(` ${name} `) : name;
}
