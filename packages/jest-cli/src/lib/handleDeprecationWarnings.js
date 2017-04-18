/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const chalk = require('chalk');
const {KEYS} = require('../constants');

module.exports = (
  pipe: stream$Writable | tty$WriteStream,
  stdin: stream$Readable | tty$ReadStream = process.stdin,
) => {
  return new Promise((resolve, reject) => {
    if (typeof stdin.setRawMode === 'function') {
      const messages = [
        chalk.red('There are deprecation warnings.\n'),
        chalk.dim(' \u203A Press ') + 'Enter' + chalk.dim(' to continue.'),
        chalk.dim(' \u203A Press ') + 'Esc' + chalk.dim(' to exit.'),
      ];

      pipe.write(messages.join('\n'));

      // $FlowFixMe
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('hex');
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
};
