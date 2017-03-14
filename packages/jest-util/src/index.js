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

const Console = require('./Console');
const FakeTimers = require('./FakeTimers');
const NullConsole = require('./NullConsole');

const clearLine = require('./clearLine');
const formatTestResults = require('./formatTestResults');
const installCommonGlobals = require('./installCommonGlobals');
const mkdirp = require('mkdirp');
const setGlobal = require('./setGlobal');
const validateCLIOptions = require('./validateCLIOptions');

const createDirectory = (path: string) => {
  try {
    mkdirp.sync(path, '777');
  } catch (e) {
    if (e.code !== 'EEXIST') {
      throw e;
    }
  }
};

module.exports = {
  Console,
  FakeTimers,
  NullConsole,
  clearLine,
  createDirectory,
  formatTestResults,
  installCommonGlobals,
  setGlobal,
  validateCLIOptions,
};
