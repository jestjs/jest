/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import chalk = require('chalk');
import slash = require('slash');
import type {Config} from '@jest/types';
import relativePath from './relativePath';

export default function formatTestPath(
  config: Config.GlobalConfig | Config.ProjectConfig,
  testPath: string,
): string {
  const {dirname, basename} = relativePath(config, testPath);
  return slash(chalk.dim(dirname + path.sep) + chalk.bold(basename));
}
