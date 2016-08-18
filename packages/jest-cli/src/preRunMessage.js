/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

const {clearLine} = require('jest-util');
const chalk = require('chalk');
const isCI = require('is-ci');

const print = stream => {
  if (process.stdout.isTTY && !isCI) {
    stream.write(chalk.bold.dim('Determining test suites to run...'));
  }
};

const remove = stream => {
  if (stream.isTTY && !isCI) {
    clearLine(stream);
  }
};

module.exports = {
  print,
  remove,
};
