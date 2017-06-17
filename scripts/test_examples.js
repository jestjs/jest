/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const path = require('path');
const fs = require('graceful-fs');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

const runCommand = require('./_runCommand');

const ROOT = path.resolve(__dirname, '..');
const BABEL_JEST_PATH = path.resolve(ROOT, 'packages/babel-jest');
const EXAMPLES_DIR = path.resolve(ROOT, 'examples');
const JEST_CLI_PATH = path.resolve(ROOT, 'packages/jest-cli');
const JEST_BIN_PATH = path.resolve(JEST_CLI_PATH, 'bin/jest.js');
const NODE_VERSION = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
const SKIP_ON_OLD_NODE = ['react-native'];
const INSTALL = ['react-native'];

const examples = fs
  .readdirSync(EXAMPLES_DIR)
  .map(file => path.resolve(EXAMPLES_DIR, file))
  .filter(f => fs.lstatSync(path.resolve(f)).isDirectory());

const link = (exampleDirectory, from) => {
  const nodeModules = exampleDirectory + path.sep + 'node_modules' + path.sep;
  const localBabelJest = path.join(nodeModules, 'babel-jest');
  mkdirp.sync(nodeModules);
  rimraf.sync(localBabelJest);
  runCommand('ln', ['-fs', from, nodeModules], exampleDirectory);
};

examples.forEach(exampleDirectory => {
  const exampleName = path.basename(exampleDirectory);
  if (NODE_VERSION < 6 && SKIP_ON_OLD_NODE.indexOf(exampleName) !== -1) {
    console.log(`Skipping ${exampleName} on node ${process.version}.`);
    return;
  }

  if (INSTALL.indexOf(exampleName) !== -1) {
    runCommand('yarn', ['--production'], exampleDirectory);
  }

  link(exampleDirectory, BABEL_JEST_PATH);
});

runCommand(
  JEST_BIN_PATH,
  ['--projects'].concat(
    examples.map(
      (example, index) => example + (index > 3 ? path.sep + 'package.json' : '')
    )
  ),
  EXAMPLES_DIR
);
