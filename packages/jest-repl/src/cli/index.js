#!/usr/bin/env node
/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const args = require('./args');
const path = require('path');
const RuntimeCLI = require('../../../jest-runtime/build/cli');
const yargs = require('yargs');

const REPL_SCRIPT = path.resolve(__dirname, './repl.js');

module.exports = function() {
  const argv = yargs
    .usage(args.usage)
    .options(args.options)
    .argv;

  argv._ = [REPL_SCRIPT];

  RuntimeCLI.Run(argv);
};
