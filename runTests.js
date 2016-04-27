/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

/**
 * This script runs tests for all jest packages, examples, etc...
 */

const fs = require('graceful-fs');
const path = require('path');
const chalk = require('chalk');
const execSync = require('child_process').execSync;
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

const PACKAGES_DIR = path.resolve(__dirname, 'packages');
const EXAMPLES_DIR = path.resolve(__dirname, 'examples');
const INTEGRATION_TESTS_DIR = path.resolve(__dirname, '__integration_tests__');

const packages = fs.readdirSync(PACKAGES_DIR)
  .map(file => path.resolve(PACKAGES_DIR, file))
  .filter(f => fs.lstatSync(path.resolve(f)).isDirectory());

const examples = fs.readdirSync(EXAMPLES_DIR)
  .map(file => path.resolve(EXAMPLES_DIR, file))
  .filter(f => fs.lstatSync(path.resolve(f)).isDirectory());

function runCommands(commands, cwd) {
  if (!cwd) {
    cwd = __dirname;
  }

  [].concat(commands).forEach(cmd => {
    console.log(chalk.green('-> ') + chalk.underline.bold('running:') +
      ' ' + chalk.bold.cyan(cmd));
    execSync(cmd, {
      cwd,
      stdio: [0, 1, 2],
    });
  });
}

function runTestsForPackage(packageDirectory) {
  console.log(chalk.bold(chalk.cyan('Testing package: ') + packageDirectory));
  runCommands('npm test', packageDirectory);
}

function runTestsForExample(exampleDirectory) {
  console.log(chalk.bold(chalk.cyan('Testing example: ') + exampleDirectory));

  runCommands('npm update', exampleDirectory);
  rimraf.sync(path.resolve(exampleDirectory, './node_modules/jest-cli'));
  mkdirp.sync(path.resolve(exampleDirectory, './node_modules/jest-cli'));
  mkdirp.sync(path.resolve(exampleDirectory, './node_modules/.bin'));

  // Using `npm link jest-cli` can create problems with module resolution,
  // so instead of this we'll create an `index.js` file that will export the
  // local `jest-cli` package.
  fs.writeFileSync(
    path.resolve(exampleDirectory, './node_modules/jest-cli/index.js'),
    `module.exports = require('../../../../');\n`, // link to the local jest
    'utf8'
  );

  // overwrite the jest link and point it to the local jest-cli
  runCommands(
    'ln -sf ../../bin/jest.js ./node_modules/.bin/jest',
    exampleDirectory
  );

  runCommands('npm test', exampleDirectory);
}


// Run all tests, these are order dependent.
runCommands('node bin/jest.js --no-cache');
runCommands('node bin/jest.js');
runCommands('node bin/jest.js --no-watchman --no-cache');
runCommands('node bin/jest.js --no-watchman');
runCommands('node bin/jest.js --testRunner=jasmine1');
runCommands('node bin/jest.js --runInBand');
runCommands('node bin/jest.js --runInBand --logHeapUsage');
runCommands('node bin/jest.js --json');
runCommands('node bin/jest.js --verbose');

runCommands('npm link --ignore-scripts');

if (process.platform === 'win32') {
  console.error(
    'Integration tests, tests for examples and packages are skipped on Windows.'
  );
  return;
}

packages.forEach(runTestsForPackage);
examples.forEach(runTestsForExample);

console.log(chalk.bold(chalk.cyan('Running integration tests:')));
runCommands('jest', INTEGRATION_TESTS_DIR);
