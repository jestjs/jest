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

const mkdirp = require('mkdirp');
const path = require('path');

const escapeStrForRegex =
  (string: string) => string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

const replacePathSepForRegex = (string: string) => {
  if (path.sep === '\\') {
    return string.replace(/(\/|\\)/g, '\\\\');
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

exports.Console = require('./Console');
exports.createDirectory = createDirectory;
exports.escapeStrForRegex = escapeStrForRegex;
exports.FakeTimers = require('./FakeTimers');
exports.formatFailureMessage = require('./formatFailureMessage');
exports.installCommonGlobals = require('./installCommonGlobals');
exports.JasmineFormatter = require('./JasmineFormatter');
exports.NullConsole = require('./NullConsole');
exports.replacePathSepForRegex = replacePathSepForRegex;
