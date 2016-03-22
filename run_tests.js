/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * This script runs tests for all packages in `./packages` and
 * example projects in `./examples`.
 */

const fs = require('graceful-fs');
const path = require('path');
const chalk = require('chalk');
const execSync = require('child_process').execSync;

const PACKAGES_DIR = './packages';
const EXAMPLES_DIR = './examples';

const packages = fs.readdirSync(PACKAGES_DIR)
  .map(file => path.resolve(PACKAGES_DIR, file))
  .filter(f => fs.lstatSync(path.resolve(f)).isDirectory());

const examples = fs.readdirSync(EXAMPLES_DIR)
  .map(file => path.resolve(EXAMPLES_DIR, file))
  .filter(f => fs.lstatSync(path.resolve(f)).isDirectory());

function runCommands(commands, cwd) {
  commands = [].concat(commands);
  commands.forEach(cmd => {
    console.log(chalk.green('-> ') + chalk.underline.bold('running:') +
      ' ' + chalk.bold.cyan(cmd));
    execSync(cmd, {
      cwd,
      stdio: [0, 1, 2],
    });
  });
}

packages.forEach(cwd => {
  console.log(chalk.bold(chalk.cyan('Testing package: ') + cwd));
  runCommands('npm test', cwd);
});

examples.forEach(cwd => {
  console.log(chalk.bold(chalk.cyan('Testing example: ') + cwd));

  runCommands([
    'npm update',
    'rm -rf ./node_modules/jest-cli',
    'mkdir -p ./node_modules/jest-cli',
    'mkdir -p ./node_modules/.bin',
  ], cwd);

  // Using `npm link jest-cli` can create problems with module resolution,
  // so instead of this we'll create an `index.js` file that will export the
  // local `jest-cli` package.
  fs.writeFileSync(
    path.resolve(cwd, './node_modules/jest-cli/index.js'),
    `module.exports = require('../../../../');\n`, // link to the local jest
    'utf8'
  );

  // overwrite the jest link and point it to the local jest-cli
  runCommands(
    ['ln -sf ../../bin/jest.js ./node_modules/.bin/jest', 'npm test'],
    cwd
  );
});
