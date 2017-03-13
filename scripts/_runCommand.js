/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const chalk = require('chalk');
const spawn = require('child_process').spawnSync;

module.exports = function runCommand(cmd, args, cwd) {
  if (!cwd) {
    cwd = __dirname;
  }
  args = args.split(' ');

  console.log(
    chalk.dim('$ cd ' + cwd) +
      '\n' +
      chalk.dim('  $ ' + cmd + ' ' + args.join(' ')) +
      '\n'
  );
  const result = spawn(cmd, args, {cwd});
  if (result.error || result.status !== 0) {
    const stdout = result.stdout.toString();
    const stderr = result.stderr.toString();
    stdout && console.log(stdout);
    stderr && console.log(chalk.red(stderr));
    const message = 'Error running command.';
    const error = new Error(message);
    error.stack = message;
    throw error;
  }
};
