/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const runCommand = require('./_runCommand');
const getPackages = require('./_getPackages');

const fs = require('graceful-fs');
const path = require('path');
const chalk = require('chalk');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

const EXAMPLES_DIR = path.resolve(__dirname, '../examples');
const JEST_CLI_PATH = path.resolve(__dirname, '../packages/jest-cli');
const JEST_BIN_PATH = path.resolve(JEST_CLI_PATH, 'bin/jest.js');
const LINKED_MODULES = ['jest-react-native'];
const NODE_VERSION = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
const SKIP_ON_OLD_NODE = ['react-native'];
const VERSION = require('../lerna').version;

const packages = getPackages();

const examples = fs.readdirSync(EXAMPLES_DIR)
  .map(file => path.resolve(EXAMPLES_DIR, file))
  .filter(f => fs.lstatSync(path.resolve(f)).isDirectory());

function runExampleTests(exampleDirectory) {
  console.log(chalk.bold(chalk.cyan('Testing example: ') + exampleDirectory));

  const exampleName = path.basename(exampleDirectory);
  if (NODE_VERSION < 6 && SKIP_ON_OLD_NODE.indexOf(exampleName) !== -1) {
    console.log(`Skipping ${exampleName} on node ${process.version}.`);
    return;
  }

  runCommand('yarn', 'install --pure-lockfile', exampleDirectory);
  packages.forEach(pkg => {
    const name = path.basename(pkg);
    const directory = path.resolve(exampleDirectory, 'node_modules', name);

    if (fs.existsSync(directory)) {
      rimraf.sync(directory);
      if (LINKED_MODULES.indexOf(name) !== -1) {
        runCommand('ln', `-s ${pkg} ./node_modules/`, exampleDirectory);
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
  runCommand('ln',
    `-sf ${JEST_BIN_PATH} ./node_modules/.bin/jest`,
    exampleDirectory
  );

  runCommand('yarn', 'test', exampleDirectory);
}

examples.forEach(runExampleTests);
