#!/usr/bin/env node
/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const Runtime = require('jest-runtime');

const args = require('./args');
const path = require('path');
const yargs = require('yargs');
const {validateCLIOptions} = require('jest-util');

const REPL_SCRIPT = path.resolve(__dirname, './repl.js');
const VERSION = require('../../package.json').version;

module.exports = function() {
  const argv = yargs.usage(args.usage).options(args.options).argv;

  validateCLIOptions(argv, args.options);

  argv._ = [REPL_SCRIPT];

  Runtime.runCLI(argv, [`Jest REPL v${VERSION}`]);
};
