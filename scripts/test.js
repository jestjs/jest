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
const LINKED_MODULES = ['jest-react-native'];
const NODE_VERSION = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
const SKIP_ON_OLD_NODE = ['react-native'];
const VERSION = require('../lerna').version;

const packages = getPackages();

const examples = fs.readdirSync(EXAMPLES_DIR)
  .map(file => path.resolve(EXAMPLES_DIR, file))
  .filter(f => fs.lstatSync(path.resolve(f)).isDirectory());

function runPackageTests(packageDirectory) {
  console.log(chalk.bold(chalk.cyan('Testing package: ') + packageDirectory));
  runCommands('npm test', packageDirectory);
}

function runExampleTests(exampleDirectory) {
  console.log(chalk.bold(chalk.cyan('Testing example: ') + exampleDirectory));

  const exampleName = path.basename(exampleDirectory);
  if (NODE_VERSION < 6 && SKIP_ON_OLD_NODE.indexOf(exampleName) !== -1) {
    console.log(`Skipping ${exampleName} on node ${process.version}.`);
    return;
  }

  runCommands('npm update', exampleDirectory);
  packages.forEach(pkg => {
    const name = path.basename(pkg);
    const directory = path.resolve(exampleDirectory, 'node_modules', name);

    if (fs.existsSync(directory)) {
      rimraf.sync(directory);
      if (LINKED_MODULES.indexOf(name) !== -1) {
        runCommands(`ln -s ${pkg} ./node_modules/`, exampleDirectory);
      } else {
        mkdirp.sync(directory);
        // Using `npm link jest-*` can create problems with module resolution,
        // so instead of this we'll create a proxy module.
        fs.writeFileSync(
          path.resolve(directory, 'index.js'),
          `module.exports = require('${pkg}');\n`,
          'utf8'
        );
        fs.writeFileSync(
          path.resolve(directory, 'package.json'),
          `{"name": "${name}", "version": "${VERSION}"}\n`,
          'utf8'
        );
      }
    }
  });

  // overwrite the jest link and point it to the local jest-cli
  mkdirp.sync(path.resolve(exampleDirectory, './node_modules/.bin'));
  runCommands(
    `ln -sf ${JEST_CLI_PATH}/bin/jest.js ./node_modules/.bin/jest`,
    exampleDirectory
  );

  runCommands('npm test', exampleDirectory);
}

packages.forEach(runPackageTests);

if (packagesOnly) {
  return;
}

// Run all tests, these are order dependent.
runCommands('node bin/jest.js --no-cache', 'packages/jest-cli');
runCommands('node bin/jest.js', 'packages/jest-cli');
runCommands('node bin/jest.js --no-watchman --no-cache', 'packages/jest-cli');
runCommands('node bin/jest.js --no-watchman', 'packages/jest-cli');
runCommands('node bin/jest.js --runInBand', 'packages/jest-cli');
runCommands('node bin/jest.js --runInBand --logHeapUsage', 'packages/jest-cli');
runCommands('node bin/jest.js --notify', 'packages/jest-cli');

console.log(chalk.bold(chalk.cyan('Running integration tests:')));
runCommands('../packages/jest-cli/bin/jest.js', INTEGRATION_TESTS_DIR);

examples.forEach(runExampleTests);
