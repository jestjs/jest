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

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

const escapePathForRegex = (dir: string) => {
  if (path.sep === '\\') {
    // Replace "\" with "/" so it's not escaped by escapeStrForRegex.
    // replacePathSepForRegex will convert it back.
    dir = dir.replace(/\\/g, '/');
  }
  return replacePathSepForRegex(escapeStrForRegex(dir));
};

const escapeStrForRegex =
  (string: string) => string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

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
  while (!fs.existsSync(path.join(root, 'package.json'))) {
    if (root === '/' || root.match(/^[A-Z]:\\/)) {
      root = cwd;
      break;
    }
    root = path.resolve(root, '..');
  }

  return root;
};

exports.Console = require('./Console');
exports.FakeTimers = require('./FakeTimers');
exports.JasmineFormatter = require('./JasmineFormatter');
exports.NullConsole = require('./NullConsole');

exports.clearLine = require('./clearLine');
exports.createDirectory = createDirectory;
exports.escapePathForRegex = escapePathForRegex;
exports.escapeStrForRegex = escapeStrForRegex;
exports.formatResultsErrors =
  require('./formatFailureMessage').formatResultsErrors;
exports.formatExecError = require('./formatFailureMessage').formatExecError;
exports.getPackageRoot = getPackageRoot;
exports.installCommonGlobals = require('./installCommonGlobals');
exports.replacePathSepForRegex = replacePathSepForRegex;
exports.separateMessageFromStack = require('./separateMessageFromStack');
exports.warnAboutUnrecognizedOptions =
  require('./args').warnAboutUnrecognizedOptions;
exports.wrap = require('./args').wrap;
