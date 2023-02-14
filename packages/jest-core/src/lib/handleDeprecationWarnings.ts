/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import {KEYS} from 'jest-watcher';

export default function handleDeprecationWarnings(
  pipe: NodeJS.WriteStream,
  stdin: NodeJS.ReadStream = process.stdin,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof stdin.setRawMode === 'function') {
      const messages = [
        chalk.red('There are deprecation warnings.\n'),
        `${chalk.dim(' \u203A Press ')}Enter${chalk.dim(' to continue.')}`,
        `${chalk.dim(' \u203A Press ')}Esc${chalk.dim(' to exit.')}`,
      ];

      pipe.write(messages.join('\n'));

      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');
      // this is a string since we set encoding above
      stdin.on('data', (key: string) => {
        if (key === KEYS.ENTER) {
          resolve();
        } else if (
          [KEYS.ESCAPE, KEYS.CONTROL_C, KEYS.CONTROL_D].indexOf(key) !== -1
        ) {
          reject();
        }
      });
    } else {
      resolve();
    }
  });
}
