/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const chalk = require('chalk');
const execSync = require('child_process').execSync;

// @example `runCommands('npm test', packageDirectory)``
module.exports = function runCommands(commands, cwd) {
  if (!cwd) {
    cwd = __dirname;
  }

  [].concat(commands).forEach(cmd => {
    let msg = chalk.green('-> ') + chalk.underline.bold('running:') +
      ' ' + chalk.bold.cyan(cmd);

    if (cwd) {
      msg += ' cwd: ' + chalk.underline.bold(cwd);
    }

    console.log(msg);

    execSync(cmd, {cwd, stdio: [0, 1, 2]});
  });
};
