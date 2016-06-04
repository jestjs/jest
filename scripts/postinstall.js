/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const path = require('path');
const isWindows = process.platform === 'win32';
const runCommands = require('./_runCommands');

console.log(`Setting up Jest's development environment...`);
const lerna = isWindows ? 'lerna.cmd' : 'lerna';
const lernaCmd = path.resolve(
  __dirname,
  '../node_modules/.bin/' + lerna + ' bootstrap'
);

runCommands(lernaCmd, path.resolve(__dirname, '..'));
