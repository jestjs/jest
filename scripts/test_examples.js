/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const path = require('path');
const fs = require('graceful-fs');

const runCommand = require('./_runCommand');

const ROOT = path.resolve(__dirname, '..');
const EXAMPLES_DIR = path.resolve(ROOT, 'examples');
const JEST_CLI_PATH = path.resolve(ROOT, 'packages/jest-cli');
const JEST_BIN_PATH = path.resolve(JEST_CLI_PATH, 'bin/jest.js');
const NODE_VERSION = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
const SKIP_ON_OLD_NODE = ['react-native'];
const INSTALL = ['react-native'];

const examples = fs
  .readdirSync(EXAMPLES_DIR)
  .map(file => path.resolve(EXAMPLES_DIR, file))
  .filter(f => fs.lstatSync(path.resolve(f)).isDirectory())
  .filter(exampleDirectory => {
    const exampleName = path.basename(exampleDirectory);
    if (NODE_VERSION < 6 && SKIP_ON_OLD_NODE.indexOf(exampleName) !== -1) {
      console.log(`Skipping ${exampleName} on node ${process.version}.`);
      return false;
    }

    if (INSTALL.indexOf(exampleName) !== -1) {
      runCommand('yarn', ['--production'], exampleDirectory);
    }

    return true;
  });

runCommand(
  JEST_BIN_PATH,
  ['--projects'].concat(
    examples.map(
      (example, index) => example + (index > 3 ? path.sep + 'package.json' : '')
    )
  )
);
