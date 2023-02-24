/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import type {Config} from '@jest/types';
import {isInteractive} from 'jest-util';

export default function getNoTestFoundFailed(
  globalConfig: Config.GlobalConfig,
): string {
  let msg = chalk.bold('No failed test found.');
  if (isInteractive) {
    msg += chalk.dim(
      `\n${
        globalConfig.watch
          ? 'Press `f` to quit "only failed tests" mode.'
          : 'Run Jest without `--onlyFailures` or with `--all` to run all tests.'
      }`,
    );
  }
  return msg;
}
