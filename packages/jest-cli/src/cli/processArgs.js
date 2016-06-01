/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const args = require('./args');
const yargs = require('yargs');

function processArgs() {
  return yargs
    .usage(args.usage)
    .options(args.options)
    .check(args.check)
    .argv;
}

module.exports = processArgs;
