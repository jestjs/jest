/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const path = require('path');
const resolve = require('resolve');

const paths =
  (process.env.NODE_PATH ? process.env.NODE_PATH.split(path.delimiter) : null);

function resolveNodeModule(path, basedir, extensions) {
  try {
    return resolve.sync(path, {basedir, paths, extensions});
  } catch (e) {}
  return null;
}

module.exports = resolveNodeModule;
