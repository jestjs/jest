/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const path = require('path');
const chalk = require('chalk');
const glob = require('glob');
const runCommand = require('./_runCommand');

const shouldWrite = process.argv[2] === 'write';
const isWindows = process.platform === 'win32';
const prettier = isWindows ? 'prettier.cmd' : 'prettier';
const prettierCmd = path.resolve(__dirname, '../node_modules/.bin/' + prettier);
const defaultOptions = {
  'bracket-spacing': 'false',
  'print-width': 80,
  'single-quote': 'true',
  'trailing-comma': 'all',
};
const config = {
  default: {
    ignore: ['**/node_modules/**'],
    patterns: [
      'packages/*/src/**/',
      'types/',
      'integration_tests/',
      'integration_tests/__tests__/',
    ],
  },
  es5Compatible: {
    ignore: [
      '**/node_modules/**',
      '**/coverage/**',
      'integration_tests/*',
      'integration_tests/__tests__/*',
    ],
    options: {
      'trailing-comma': 'es5',
    },
    patterns: [
      'examples/**/',
      'scripts/**/',
      'integration_tests/**/',
      'website/server/*',
      'website/layout/*',
    ],
  },
};

Object.keys(config).forEach(key => {
  const patterns = config[key].patterns;
  const options = config[key].options;
  const ignore = config[key].ignore;

  const globPattern = patterns.length > 1
    ? `{${patterns.join(',')}}*.js`
    : `${patterns.join(',')}*.js`;
  const files = glob.sync(globPattern, {ignore});

  const args = Object.keys(defaultOptions)
    .map(key => `--${key}=${(options && options[key]) || defaultOptions[key]}`)
    .concat(`--${shouldWrite ? 'write' : 'l'}`, files);

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
});
