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

import type {Path} from 'types/Config';

const Console = require('./Console');
const FakeTimers = require('./FakeTimers');
const NullConsole = require('./NullConsole');

const {
  formatExecError,
  formatResultsErrors,
  formatStackTrace,
} = require('./messages');
const clearLine = require('./clearLine');
const fileExists = require('jest-file-exists');
const formatTestResults = require('./formatTestResults');
const installCommonGlobals = require('./installCommonGlobals');
const mkdirp = require('mkdirp');
const path = require('path');
const separateMessageFromStack = require('./separateMessageFromStack');
const setGlobal = require('./setGlobal');
const validateCLIOptions = require('./validateCLIOptions');

const escapePathForRegex = (dir: string) => {
  if (path.sep === '\\') {
    // Replace "\" with "/" so it's not escaped by escapeStrForRegex.
    // replacePathSepForRegex will convert it back.
    dir = dir.replace(/\\/g, '/');
  }
  return replacePathSepForRegex(escapeStrForRegex(dir));
};

const escapeStrForRegex =
  (string: string) => string.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');

const replacePathSepForRegex = (string: string) => {
  if (path.sep === '\\') {
    return string.replace(/(\/|\\(?!\.))/g, '\\\\');
  }
  return string;
};

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
  while (!fileExists(path.join(root, 'package.json'))) {
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
  escapePathForRegex,
  escapeStrForRegex,
  formatExecError,
  formatResultsErrors,
  formatStackTrace,
  formatTestResults,
  getPackageRoot,
  installCommonGlobals,
  replacePathSepForRegex,
  separateMessageFromStack,
  setGlobal,
  validateCLIOptions,
};
