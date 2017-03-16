/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const SearchSource = require('./SearchSource');
const TestRunner = require('./TestRunner');
const TestWatcher = require('./TestWatcher');

const {run, runCLI} = require('./cli');

const VERSION = require('../package.json').version;

module.exports = {
  SearchSource,
  TestRunner,
  TestWatcher,
  getVersion: () => VERSION,
  run,
  runCLI,
};
