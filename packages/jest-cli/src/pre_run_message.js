/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {clearLine} from 'jest-util';

import chalk from 'chalk';
import isCI from 'is-ci';

export const print = (stream: stream$Writable | tty$WriteStream) => {
  if (process.stdout.isTTY && !isCI) {
    stream.write(chalk.bold.dim('Determining test suites to run...'));
  }
};

export const remove = (stream: stream$Writable | tty$WriteStream) => {
  if (stream.isTTY && !isCI) {
    clearLine(stream);
  }
};
