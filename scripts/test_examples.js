/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('path');
const fs = require('graceful-fs');

const runCommand = require('./_runCommand');

const ROOT = path.resolve(__dirname, '..');
const EXAMPLES_DIR = path.resolve(ROOT, 'examples');
const JEST_CLI_PATH = path.resolve(ROOT, 'packages/jest-cli');
const JEST_BIN_PATH = path.resolve(JEST_CLI_PATH, 'bin/jest.js');

const examples = fs
  .readdirSync(EXAMPLES_DIR)
  .map(file => path.resolve(EXAMPLES_DIR, file))
  .filter(f => fs.lstatSync(path.resolve(f)).isDirectory());

runCommand(
  JEST_BIN_PATH,
  ['--projects'].concat(
    examples.map(
      (example, index) => example + (index > 3 ? path.sep + 'package.json' : '')
    )
  )
);
