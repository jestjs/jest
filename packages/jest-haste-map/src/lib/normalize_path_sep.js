/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

const path = require('path');

let normalizePathSep;
if (path.sep == '/') {
  normalizePathSep = (filePath: string) => filePath;
} else {
  normalizePathSep = (filePath: string) => filePath.replace(/\//g, path.sep);
}

module.exports = normalizePathSep;
