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
const path = require('path');
const fs = require('fs');
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

const getPackageRoot = () => {
  const cwd = process.cwd();

  // Is the cwd somewhere within an npm package?
  let root = cwd;
  while (!fs.existsSync(path.join(root, 'package.json'))) {
    if (root === '/' || root.match(/^[A-Z]:\\/)) {
      root = cwd;
      break;
    }
    root = path.resolve(root, '..');
  }

  return root;
};

module.exports = {
  Console,
  FakeTimers,
  NullConsole,
  clearLine,
  createDirectory,
  formatTestResults,
  getPackageRoot,
  installCommonGlobals,
  setGlobal,
  validateCLIOptions,
};
