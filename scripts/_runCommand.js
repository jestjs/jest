/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const chalk = require('chalk');
const spawnSync = require('child_process').spawnSync;

/**
 * @example `runCommands('npm', 'test', packageDirectory)`
 * @param {boolean} options.suppressOutput don't print output to stdout
 */
module.exports = function runCommand(cmd, args, cwd, options) {
  options || (options = {});

  if (!cwd) {
    cwd = __dirname;
  }
  args = args.split(' ');

  let msg = chalk.green('-> ') + chalk.underline.bold('running:') +
    ' ' + chalk.bold.cyan(cmd + ' ' + args.join(' '));

  if (cwd) {
    msg += ' cwd: ' + chalk.underline.bold(cwd);
  }

  const spawnOpts = {cwd};

  if (options.suppressOutput) {
    msg += chalk.red(' (output supressed)');
  } else {
    Object.assign(spawnOpts, {stdio: [0, 1, 1]});
  }

  console.log(msg);

  const result = spawnSync(cmd, args, spawnOpts);

  if (result.error || result.status !== 0) {
    result.error && console.log(chalk.red(result.error));

    // print output if it was suppressed
    if (options.suppressOutput) {
      result.stdout && console.log(result.stdout.toString());
      result.stderr && console.log(chalk.red(result.stderr.toString()));
    }

    console.log(chalk.red(
      `-> failed running: ${cmd + ' ' + args.join(' ')}`
    ));
    process.exit(1);
  }
};
