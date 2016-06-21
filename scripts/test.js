/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const runCommands = require('./_runCommands');
const getPackages = require('./_getPackages');

if (process.platform === 'win32') {
  console.error('Tests are skipped on Windows.');
  return;
}

const packagesOnly =
  process.argv.indexOf('-p') !== -1 ||
  process.argv.indexOf('--packages-only') !== -1;

const fs = require('graceful-fs');
const path = require('path');
const chalk = require('chalk');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

const EXAMPLES_DIR = path.resolve(__dirname, '../examples');
const INTEGRATION_TESTS_DIR = path.resolve(__dirname, '../integration_tests');
const JEST_CLI_PATH = path.resolve(__dirname, '../packages/jest-cli');


const examples = fs.readdirSync(EXAMPLES_DIR)
  .map(file => path.resolve(EXAMPLES_DIR, file))
  .filter(f => fs.lstatSync(path.resolve(f)).isDirectory());

function runPackageTests(packageDirectory) {
  console.log(chalk.bold(chalk.cyan('Testing package: ') + packageDirectory));
  runCommands('npm test', packageDirectory);
}

function runExampleTests(exampleDirectory) {
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
    `module.exports = require('${JEST_CLI_PATH}');\n`, // link to the local jest
    'utf8'
  );

  // overwrite the jest link and point it to the local jest-cli
  runCommands(
    `ln -sf ${JEST_CLI_PATH}/bin/jest.js ./node_modules/.bin/jest`,
    exampleDirectory
  );

  runCommands('npm test', exampleDirectory);
}


getPackages().forEach(runPackageTests);

if (packagesOnly) {
  return;
}

// Run all tests, these are order dependent.
runCommands('node bin/jest.js --no-cache', 'packages/jest-cli');
runCommands('node bin/jest.js', 'packages/jest-cli');
runCommands('node bin/jest.js --no-watchman --no-cache', 'packages/jest-cli');
runCommands('node bin/jest.js --no-watchman', 'packages/jest-cli');
runCommands('node bin/jest.js --testRunner=jasmine1', 'packages/jest-cli');
runCommands('node bin/jest.js --runInBand', 'packages/jest-cli');
runCommands('node bin/jest.js --runInBand --logHeapUsage', 'packages/jest-cli');
runCommands('node bin/jest.js --json', 'packages/jest-cli');
runCommands('node bin/jest.js --verbose', 'packages/jest-cli');
runCommands('node bin/jest.js --notify', 'packages/jest-cli');

examples.forEach(runExampleTests);

console.log(chalk.bold(chalk.cyan('Running integration tests:')));
runCommands('../packages/jest-cli/bin/jest.js', INTEGRATION_TESTS_DIR);
