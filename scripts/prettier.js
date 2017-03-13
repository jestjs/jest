/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const path = require('path');
const chalk = require('chalk');
const runCommand = require('./_runCommand');

const shouldWrite = process.argv[2] === 'write';
const isWindows = process.platform === 'win32';
const prettier = isWindows ? 'prettier.cmd' : 'prettier';
const prettierCmd = path.resolve(__dirname, '../node_modules/.bin/' + prettier);
const args = [
  `--${shouldWrite ? 'write' : 'l'} packages/*/src/**/*.js`,
  `--single-quote`,
  `--trailing-comma=all`,
  `--bracket-spacing=false`,
].join(' ');

try {
  runCommand(prettierCmd, args, path.resolve(__dirname, '..'));
} catch (e) {
  console.log(e);
  if (!shouldWrite) {
    console.log(
      chalk.red(
        `  This project uses prettier to format all JavaScript code.\n`
      ) +
        chalk.dim(`    Please run `) +
        chalk.reset('yarn prettier') +
        chalk.dim(` and add changes to files listed above to your commit.`) +
        `\n`
    );
  }
}
